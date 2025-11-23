import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const FinancialReportExport = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = async () => {
    if (!startDate || !endDate) {
      toast.error("Selecciona un rango de fechas");
      return;
    }

    if (startDate > endDate) {
      toast.error("La fecha inicial debe ser anterior a la fecha final");
      return;
    }

    setIsExporting(true);
    try {
      // Fetch payment data with related information
      const { data: pagos, error } = await supabase
        .from("pago")
        .select(`
          id,
          monto_total,
          comision_monto,
          comision_porcentaje,
          monto_neto,
          estado_pago,
          created_at,
          ticket_id,
          cotizacion:cotizacion_id (
            id,
            tecnico:tecnico_id (
              id,
              user:user_id (
                nombre,
                email,
                rut
              )
            )
          ),
          ticket:ticket_id (
            titulo,
            categoria,
            cliente:cliente_id (
              user:user_id (
                nombre,
                email,
                rut
              )
            )
          )
        `)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!pagos || pagos.length === 0) {
        toast.error("No se encontraron pagos en el rango seleccionado");
        setIsExporting(false);
        return;
      }

      // Prepare CSV data
      const headers = [
        "ID Pago",
        "Fecha",
        "Título Ticket",
        "Categoría",
        "Cliente Nombre",
        "Cliente Email",
        "Cliente RUT",
        "Técnico Nombre",
        "Técnico Email",
        "Técnico RUT",
        "Monto Total",
        "Comisión %",
        "Comisión Monto",
        "Monto Neto",
        "Estado"
      ];

      const rows = pagos.map((pago: any) => {
        const ticket = pago.ticket;
        const cotizacion = pago.cotizacion;
        const cliente = ticket?.cliente?.user;
        const tecnico = cotizacion?.tecnico?.user;

        return [
          pago.id,
          format(new Date(pago.created_at), "dd/MM/yyyy HH:mm", { locale: es }),
          ticket?.titulo || "N/A",
          ticket?.categoria || "N/A",
          cliente?.nombre || "N/A",
          cliente?.email || "N/A",
          cliente?.rut || "N/A",
          tecnico?.nombre || "N/A",
          tecnico?.email || "N/A",
          tecnico?.rut || "N/A",
          pago.monto_total,
          pago.comision_porcentaje || 15,
          pago.comision_monto || 0,
          pago.monto_neto || 0,
          pago.estado_pago
        ];
      });

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => {
          // Escape cells containing commas or quotes
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(","))
      ].join("\n");

      // Add BOM for proper Excel UTF-8 support
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      
      // Download file
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_financiero_${format(startDate, "yyyy-MM-dd")}_${format(endDate, "yyyy-MM-dd")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Reporte exportado: ${pagos.length} registros`);
    } catch (error: any) {
      console.error("Error exporting report:", error);
      toast.error("Error al exportar el reporte: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const exportSummaryPDF = async () => {
    if (!startDate || !endDate) {
      toast.error("Selecciona un rango de fechas");
      return;
    }

    if (startDate > endDate) {
      toast.error("La fecha inicial debe ser anterior a la fecha final");
      return;
    }

    setIsExporting(true);
    try {
      // Fetch summary data
      const { data: pagos, error } = await supabase
        .from("pago")
        .select("monto_total, comision_monto, monto_neto, estado_pago, created_at")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) throw error;

      if (!pagos || pagos.length === 0) {
        toast.error("No se encontraron pagos en el rango seleccionado");
        setIsExporting(false);
        return;
      }

      // Calculate totals
      const totals = pagos.reduce((acc, pago) => ({
        total: acc.total + pago.monto_total,
        comision: acc.comision + (pago.comision_monto || 0),
        neto: acc.neto + (pago.monto_neto || 0)
      }), { total: 0, comision: 0, neto: 0 });

      // Count by status
      const statusCounts = pagos.reduce((acc: any, pago) => {
        acc[pago.estado_pago] = (acc[pago.estado_pago] || 0) + 1;
        return acc;
      }, {});

      // Create simple text-based PDF alternative (HTML report)
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Reporte Financiero</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #333; border-bottom: 2px solid #4a5568; padding-bottom: 10px; }
            .summary { background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .metric { margin: 10px 0; }
            .metric-label { font-weight: bold; color: #4a5568; }
            .metric-value { font-size: 24px; color: #2d3748; margin-left: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background: #4a5568; color: white; }
          </style>
        </head>
        <body>
          <h1>Reporte Financiero TecWork</h1>
          <p><strong>Periodo:</strong> ${format(startDate, "dd/MM/yyyy", { locale: es })} - ${format(endDate, "dd/MM/yyyy", { locale: es })}</p>
          <p><strong>Generado:</strong> ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}</p>
          
          <div class="summary">
            <h2>Resumen General</h2>
            <div class="metric">
              <span class="metric-label">Ingresos Totales:</span>
              <span class="metric-value">$${totals.total.toLocaleString('es-CL')}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Comisiones Ganadas:</span>
              <span class="metric-value">$${totals.comision.toLocaleString('es-CL')}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Pagado a Técnicos:</span>
              <span class="metric-value">$${totals.neto.toLocaleString('es-CL')}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Total de Transacciones:</span>
              <span class="metric-value">${pagos.length}</span>
            </div>
          </div>

          <h2>Distribución por Estado</h2>
          <table>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(statusCounts).map(([estado, cantidad]) => `
                <tr>
                  <td>${estado}</td>
                  <td>${cantidad}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `resumen_financiero_${format(startDate, "yyyy-MM-dd")}_${format(endDate, "yyyy-MM-dd")}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Resumen exportado exitosamente");
    } catch (error: any) {
      console.error("Error exporting summary:", error);
      toast.error("Error al exportar el resumen: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar Reporte Financiero</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fecha Inicio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Fecha Fin</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  locale={es}
                  disabled={(date) => startDate ? date < startDate : false}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={exportToCSV}
            disabled={!startDate || !endDate || isExporting}
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV Detallado
          </Button>

          <Button
            onClick={exportSummaryPDF}
            disabled={!startDate || !endDate || isExporting}
            variant="outline"
            className="flex-1"
          >
            <FileText className="mr-2 h-4 w-4" />
            Exportar Resumen HTML
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          El CSV incluye todos los detalles de transacciones. El resumen HTML se puede imprimir o convertir a PDF desde el navegador.
        </p>
      </CardContent>
    </Card>
  );
};
