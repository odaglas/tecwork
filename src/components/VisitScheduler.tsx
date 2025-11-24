import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, Info, Loader2, Plus, X } from "lucide-react";
import { format, addHours, parse, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface DaySchedule {
  date: Date;
  time: string;
  hours: number;
}

interface VisitSchedulerProps {
  cotizacionId: string;
  tecnicoId: string;
  currentUserId: string;
  isCliente: boolean;
  duracionEstimadaHoras: number;
  onVisitScheduled?: () => void;
  existingVisit?: {
    fecha: string | null;
    hora: string | null;
    estado: string | null;
    propuestaPor: string | null;
    visita_duracion_horas?: number | null;
  };
}

export const VisitScheduler = ({
  cotizacionId,
  tecnicoId,
  currentUserId,
  isCliente,
  duracionEstimadaHoras,
  onVisitScheduled,
  existingVisit,
}: VisitSchedulerProps) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedHours, setSelectedHours] = useState<number>(2);
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [busySlots, setBusySlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Generate time slots from 8:00 to 21:00 (workday ends at 22:00, last selectable is 21:00)
  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, "0")}:00`;
  });

  useEffect(() => {
    if (selectedDate) {
      fetchBusySlots(selectedDate);
    }
  }, [selectedDate, tecnicoId]);

  const fetchBusySlots = async (date: Date) => {
    setLoadingSlots(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      
      // Fetch all confirmed visits for this technician on this date
      const { data: visits, error } = await supabase
        .from("cotizacion")
        .select("visita_hora_propuesta, visita_duracion_horas")
        .eq("tecnico_id", tecnicoId)
        .eq("visita_fecha_propuesta", dateStr)
        .eq("visita_estado", "confirmada");

      if (error) throw error;

      // Calculate busy time slots including 2-hour buffer
      const busy: string[] = [];
      visits?.forEach((visit) => {
        if (visit.visita_hora_propuesta) {
          const startTime = parse(visit.visita_hora_propuesta, "HH:mm:ss", date);
          const duration = visit.visita_duracion_horas || 2;
          
          // Block the visit time + duration + 2 hour buffer
          for (let i = 0; i < duration + 2; i++) {
            const blockedTime = format(addHours(startTime, i), "HH:mm");
            busy.push(blockedTime);
          }
        }
      });

      setBusySlots(busy);
    } catch (error: any) {
      console.error("Error fetching busy slots:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const addDaySchedule = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Campos incompletos",
        description: "Por favor selecciona una fecha y hora",
        variant: "destructive",
      });
      return;
    }

    const newSchedule: DaySchedule = {
      date: selectedDate,
      time: selectedTime,
      hours: selectedHours,
    };

    setDaySchedules([...daySchedules, newSchedule]);
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedHours(2);
  };

  const removeDaySchedule = (index: number) => {
    setDaySchedules(daySchedules.filter((_, i) => i !== index));
  };

  const getTotalHours = () => {
    return daySchedules.reduce((sum, schedule) => sum + schedule.hours, 0);
  };

  const handleProposeVisit = async () => {
    if (daySchedules.length === 0) {
      toast({
        title: "Campos incompletos",
        description: "Por favor agrega al menos un día al programa",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use first schedule entry for main fields
      const firstSchedule = daySchedules[0];
      const dateStr = format(firstSchedule.date, "yyyy-MM-dd");
      
      const scheduleData = daySchedules.map(s => ({
        date: format(s.date, "yyyy-MM-dd"),
        time: s.time,
        hours: s.hours,
      }));

      const { error } = await supabase
        .from("cotizacion")
        .update({
          visita_fecha_propuesta: dateStr,
          visita_hora_propuesta: firstSchedule.time,
          visita_duracion_horas: getTotalHours(),
          visita_schedule: scheduleData,
          visita_estado: "pendiente",
          visita_propuesta_por: currentUserId,
        })
        .eq("id", cotizacionId);

      if (error) throw error;

      toast({
        title: "Visita propuesta",
        description: `Programa de ${daySchedules.length} ${daySchedules.length === 1 ? 'día' : 'días'} propuesto`,
      });

      onVisitScheduled?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVisit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("cotizacion")
        .update({
          visita_estado: "confirmada",
        })
        .eq("id", cotizacionId);

      if (error) throw error;

      toast({
        title: "Visita confirmada",
        description: "La visita ha sido confirmada exitosamente",
      });

      onVisitScheduled?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canPropose = !existingVisit?.fecha || existingVisit?.propuestaPor !== currentUserId;
  const canConfirm = existingVisit?.estado === "pendiente" && existingVisit?.propuestaPor !== currentUserId;
  const isConfirmed = existingVisit?.estado === "confirmada";

  const calculateEndTime = (startDate: Date, startTime: string, hours: number) => {
    const workdayStart = 8;
    const workdayEnd = 22;
    const maxHoursPerDay = workdayEnd - workdayStart;
    
    const startHour = parseInt(startTime.split(':')[0]);
    const hoursRemainingToday = workdayEnd - startHour;
    
    if (hours <= hoursRemainingToday) {
      return { endDate: startDate, endTime: addHours(parse(startTime, "HH:mm", startDate), hours) };
    }
    
    let remainingHours = hours - hoursRemainingToday;
    let currentDate = addHours(startDate, 24);
    let daysNeeded = 1;
    
    while (remainingHours > maxHoursPerDay) {
      remainingHours -= maxHoursPerDay;
      currentDate = addHours(currentDate, 24);
      daysNeeded++;
    }
    
    const finalEndTime = addHours(parse(`${workdayStart}:00`, "HH:mm", currentDate), remainingHours);
    return { endDate: currentDate, endTime: finalEndTime, daysNeeded: daysNeeded + 1 };
  };

  if (isConfirmed && existingVisit?.fecha && existingVisit?.hora) {
    const visitDate = new Date(existingVisit.fecha);
    const visitHours = existingVisit.visita_duracion_horas || duracionEstimadaHoras;
    const { endDate, endTime, daysNeeded } = calculateEndTime(visitDate, format(parse(existingVisit.hora, "HH:mm:ss", visitDate), "HH:mm"), visitHours);
    const bufferEndTime = addHours(endTime, 2);

    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Visita Confirmada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-primary/10 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="space-y-2">
              <div className="font-semibold text-foreground">
                Visita programada: {format(visitDate, "dd/MM/yyyy", { locale: es })} a las {format(parse(existingVisit.hora, "HH:mm:ss", visitDate), "HH:mm")}
              </div>
              <div>Duración estimada: {visitHours} {visitHours === 1 ? "hora" : "horas"}</div>
              {daysNeeded && daysNeeded > 1 && (
                <div className="text-sm">
                  Trabajo de múltiples días: {daysNeeded} {daysNeeded === 1 ? "día" : "días"}
                </div>
              )}
              <div className="text-muted-foreground text-sm">
                Técnico quedará ocupado hasta: {format(endDate, "dd/MM/yyyy", { locale: es })} a las {format(bufferEndTime, "HH:mm")} (incluye 2 horas de margen de viaje)
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (existingVisit?.fecha && existingVisit?.hora && existingVisit?.estado === "pendiente") {
    const visitDate = new Date(existingVisit.fecha);
    const isProposeByCurrentUser = existingVisit.propuestaPor === currentUserId;

    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Visita Propuesta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-muted/50 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription>
              <div className="font-semibold text-foreground">
                {isProposeByCurrentUser ? "Tu propuesta:" : "Propuesta recibida:"}
              </div>
              <div className="mt-2">
                {format(visitDate, "dd/MM/yyyy", { locale: es })} a las {format(parse(existingVisit.hora, "HH:mm:ss", visitDate), "HH:mm")}
              </div>
            </AlertDescription>
          </Alert>

          {canConfirm && (
            <Button
              onClick={handleConfirmVisit}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>Confirmar Visita</>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Programar Visita
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Day Schedules List */}
        {daySchedules.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Programa Actual ({getTotalHours()} horas totales)</Label>
            <div className="space-y-2">
              {daySchedules.map((schedule, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div className="flex-1">
                    <div className="font-medium">
                      Día {index + 1}: {format(schedule.date, "dd/MM/yyyy", { locale: es })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Hora: {schedule.time} • Duración: {schedule.hours}h
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDaySchedule(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hours Input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Horas para este Día</Label>
          <input
            type="number"
            min="1"
            max="14"
            value={selectedHours}
            onChange={(e) => setSelectedHours(Math.max(1, Math.min(14, parseInt(e.target.value) || 1)))}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground">Máximo 14 horas por día (8:00 a 22:00)</p>
        </div>

        {/* Calendar */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Selecciona el Día</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => isBefore(date, startOfDay(new Date()))}
            className="rounded-md border pointer-events-auto"
          />
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Horarios Disponibles para el {format(selectedDate, "dd/MM/yyyy", { locale: es })}
            </Label>
            
            {loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time) => {
                  const isBusy = busySlots.includes(time);
                  const isSelected = selectedTime === time;

                  return (
                    <Button
                      key={time}
                      variant={isSelected ? "default" : "outline"}
                      disabled={isBusy}
                      onClick={() => setSelectedTime(time)}
                      className={`${isBusy ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      {time}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Time Slots */}
        {selectedDate && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Horarios Disponibles para el {format(selectedDate, "dd/MM/yyyy", { locale: es })}
            </Label>
            
            {loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time) => {
                  const isBusy = busySlots.includes(time);
                  const isSelected = selectedTime === time;

                  return (
                    <Button
                      key={time}
                      variant={isSelected ? "default" : "outline"}
                      disabled={isBusy}
                      onClick={() => setSelectedTime(time)}
                      className={`${isBusy ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      {time}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Day Button */}
        {selectedDate && selectedTime && (
          <Button
            onClick={addDaySchedule}
            variant="outline"
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Día al Programa
          </Button>
        )}

        {/* Action Button */}
        <Button
          onClick={handleProposeVisit}
          disabled={daySchedules.length === 0 || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Proponiendo...
            </>
          ) : (
            <>Proponer Programa de Visita</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);
