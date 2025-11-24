import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, Info, Loader2 } from "lucide-react";
import { format, addHours, parse, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

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
  const [loading, setLoading] = useState(false);
  const [busySlots, setBusySlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState<number>(duracionEstimadaHoras);

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

  const handleProposeVisit = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Campos incompletos",
        description: "Por favor selecciona una fecha y hora",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      const { error } = await supabase
        .from("cotizacion")
        .update({
          visita_fecha_propuesta: dateStr,
          visita_hora_propuesta: selectedTime,
          visita_duracion_horas: estimatedHours,
          visita_estado: "pendiente",
          visita_propuesta_por: currentUserId,
        })
        .eq("id", cotizacionId);

      if (error) throw error;

      toast({
        title: "Visita propuesta",
        description: `Fecha y hora propuestas: ${format(selectedDate, "dd/MM/yyyy", { locale: es })} a las ${selectedTime}`,
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
        {/* Estimated Hours Input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Horas Estimadas de Trabajo</Label>
          <input
            type="number"
            min="1"
            max="168"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Calendar */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Selecciona el Día de Inicio</Label>
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

        {/* Summary */}
        {selectedDate && selectedTime && (
          <Alert className="bg-muted/50 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="space-y-1 text-sm">
              {(() => {
                const { endDate, endTime, daysNeeded } = calculateEndTime(selectedDate, selectedTime, estimatedHours);
                const bufferEndTime = addHours(endTime, 2);
                return (
                  <>
                    <div className="font-semibold text-foreground">
                      Visita programada: {format(selectedDate, "dd/MM/yyyy", { locale: es })} a las {selectedTime}
                    </div>
                    <div>Duración estimada: {estimatedHours} {estimatedHours === 1 ? "hora" : "horas"}</div>
                    {daysNeeded && daysNeeded > 1 && (
                      <div className="font-medium">
                        Trabajo de múltiples días: {daysNeeded} {daysNeeded === 1 ? "día" : "días"}
                      </div>
                    )}
                    <div className="text-muted-foreground">
                      Técnico quedará ocupado hasta: {format(endDate, "dd/MM/yyyy", { locale: es })} a las {format(bufferEndTime, "HH:mm")}
                      <span className="text-xs"> (incluye 2h de margen de viaje)</span>
                    </div>
                  </>
                );
              })()}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        <Button
          onClick={handleProposeVisit}
          disabled={!selectedDate || !selectedTime || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Proponiendo...
            </>
          ) : (
            <>Proponer esta Fecha y Hora</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);
