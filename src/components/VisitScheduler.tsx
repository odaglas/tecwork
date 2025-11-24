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
  startTime: string;
  endTime: string;
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
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [busySlots, setBusySlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);
  const [existingSchedule, setExistingSchedule] = useState<any>(null);

  // Generate time slots from 8:00 to 22:00 (end time can be up to 22:00)
  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, "0")}:00`;
  });

  const calculateHours = (start: string, end: string): number => {
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    return endHour - startHour;
  };

  useEffect(() => {
    if (selectedDate) {
      fetchBusySlots(selectedDate);
    }
  }, [selectedDate, tecnicoId]);

  // Load existing schedule from database
  useEffect(() => {
    const loadSchedule = async () => {
      if (cotizacionId) {
        const { data, error } = await supabase
          .from("cotizacion")
          .select("visita_schedule")
          .eq("id", cotizacionId)
          .single();

        if (!error && data?.visita_schedule) {
          setExistingSchedule(data.visita_schedule);
        }
      }
    };
    loadSchedule();
  }, [cotizacionId]);

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
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      toast({
        title: "Campos incompletos",
        description: "Por favor selecciona fecha, hora de inicio y hora de fin",
        variant: "destructive",
      });
      return;
    }

    const hours = calculateHours(selectedStartTime, selectedEndTime);
    
    if (hours <= 0) {
      toast({
        title: "Horario inválido",
        description: "La hora de fin debe ser posterior a la hora de inicio",
        variant: "destructive",
      });
      return;
    }

    if (hours > 14) {
      toast({
        title: "Horario inválido",
        description: "No se pueden programar más de 14 horas en un día (8:00 a 22:00)",
        variant: "destructive",
      });
      return;
    }

    // Check if this date already exists in schedules
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const existingSchedule = daySchedules.find(
      s => format(s.date, "yyyy-MM-dd") === dateStr
    );

    if (existingSchedule) {
      toast({
        title: "Día duplicado",
        description: "Ya agregaste este día al programa. Selecciona otro día.",
        variant: "destructive",
      });
      return;
    }

    const newSchedule: DaySchedule = {
      date: selectedDate,
      startTime: selectedStartTime,
      endTime: selectedEndTime,
      hours,
    };

    setDaySchedules([...daySchedules, newSchedule]);
    
    // Reset all selections and force calendar refresh
    setSelectedDate(undefined);
    setSelectedStartTime("");
    setSelectedEndTime("");
    setCalendarKey(prev => prev + 1);
    
    toast({
      title: "Día agregado",
      description: `${format(selectedDate, "dd/MM/yyyy", { locale: es })} de ${selectedStartTime} a ${selectedEndTime} (${hours}h)`,
    });
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
        startTime: s.startTime,
        endTime: s.endTime,
        hours: s.hours,
      }));

      const { error } = await supabase
        .from("cotizacion")
        .update({
          visita_fecha_propuesta: dateStr,
          visita_hora_propuesta: firstSchedule.startTime,
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
              <div className="font-semibold text-foreground mb-3">
                {isProposeByCurrentUser ? "Tu propuesta:" : "Propuesta recibida:"}
              </div>
              
              {/* Show multi-day schedule if available */}
              {existingSchedule && Array.isArray(existingSchedule) && existingSchedule.length > 0 ? (
                <div className="space-y-3">
                  <div className="font-medium text-sm">Programa de trabajo ({existingSchedule.length} {existingSchedule.length === 1 ? 'día' : 'días'}):</div>
                  {existingSchedule.map((schedule: any, index: number) => (
                    <div key={index} className="pl-3 border-l-2 border-primary/30">
                      <div className="font-medium">
                        Día {index + 1}: {format(new Date(schedule.date), "dd/MM/yyyy", { locale: es })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {schedule.startTime} - {schedule.endTime} ({schedule.hours}h)
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <span className="font-medium">Total:</span> {existingSchedule.reduce((sum: number, s: any) => sum + s.hours, 0)} horas
                  </div>
                </div>
              ) : (
                <div>
                  {format(visitDate, "dd/MM/yyyy", { locale: es })} a las {format(parse(existingVisit.hora, "HH:mm:ss", visitDate), "HH:mm")}
                </div>
              )}
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
                      {schedule.startTime} - {schedule.endTime} ({schedule.hours}h)
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

        {/* Calendar */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Selecciona el Día</Label>
          <Calendar
            key={calendarKey}
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
              setSelectedStartTime("");
              setSelectedEndTime("");
            }}
            disabled={(date) => {
              if (isBefore(date, startOfDay(new Date()))) return true;
              const dateStr = format(date, "yyyy-MM-dd");
              return daySchedules.some(s => format(s.date, "yyyy-MM-dd") === dateStr);
            }}
            className="rounded-md border pointer-events-auto"
          />
        </div>

        {/* Start Time Slots */}
        {selectedDate && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Hora de Inicio para el {format(selectedDate, "dd/MM/yyyy", { locale: es })}
            </Label>
            
            {loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.slice(0, -1).map((time) => {
                  const isBusy = busySlots.includes(time);
                  const isSelected = selectedStartTime === time;

                  return (
                    <Button
                      key={time}
                      variant={isSelected ? "default" : "outline"}
                      disabled={isBusy}
                      onClick={() => {
                        setSelectedStartTime(time);
                        setSelectedEndTime("");
                      }}
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

        {/* End Time Slots */}
        {selectedDate && selectedStartTime && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Hora de Fin (hasta las 22:00)
            </Label>
            
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((time) => {
                const startHour = parseInt(selectedStartTime.split(':')[0]);
                const endHour = parseInt(time.split(':')[0]);
                const isDisabled = endHour <= startHour;
                const isSelected = selectedEndTime === time;

                return (
                  <Button
                    key={time}
                    variant={isSelected ? "default" : "outline"}
                    disabled={isDisabled}
                    onClick={() => setSelectedEndTime(time)}
                    className={`${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    {time}
                  </Button>
                );
              })}
            </div>
            
            {selectedEndTime && (
              <p className="text-sm text-muted-foreground">
                Duración: {calculateHours(selectedStartTime, selectedEndTime)} horas
              </p>
            )}
          </div>
        )}

        {/* Add Day Button */}
        {selectedDate && selectedStartTime && selectedEndTime && (
          <Button
            onClick={addDaySchedule}
            variant="outline"
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Día al Programa ({calculateHours(selectedStartTime, selectedEndTime)}h)
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
