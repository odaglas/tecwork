import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield, FileText, AlertCircle, Scale, CreditCard, Users, Lock, Gavel, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

const TerminosCondiciones = () => {
  const sections = [
    { id: "introduccion", title: "Introducción", icon: FileText },
    { id: "marco-legal", title: "Marco Legal", icon: Scale },
    { id: "registro", title: "Registro de Usuario", icon: Users },
    { id: "validacion", title: "Validación de Técnicos", icon: Shield },
    { id: "pagos", title: "Pagos y Pago Protegido", icon: CreditCard },
    { id: "comisiones", title: "Comisiones", icon: FileText },
    { id: "prohibiciones", title: "Prohibiciones", icon: AlertCircle },
    { id: "privacidad", title: "Privacidad de Datos", icon: Lock },
    { id: "disputas", title: "Resolución de Disputas", icon: Gavel },
    { id: "contacto", title: "Contacto", icon: FileText },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Términos y Condiciones
              </h1>
              <Button onClick={handleDownloadPDF} variant="outline" className="w-fit">
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
            
            <div className="bg-[hsl(210,100%,31%)]/10 border border-[hsl(210,100%,31%)]/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[hsl(210,100%,31%)] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                  Última actualización: 1 de diciembre de 2024
                </p>
              </div>
            </div>
          </div>

          {/* Main Content with Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <div className="sticky top-4">
                <nav className="bg-card border border-border rounded-lg p-4">
                  <h2 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">
                    Navegación
                  </h2>
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <ul className="space-y-2">
                      {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                          <li key={section.id}>
                            <button
                              onClick={() => scrollToSection(section.id)}
                              className="w-full text-left px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-[hsl(210,100%,31%)] transition-colors flex items-center gap-2"
                            >
                              <Icon className="w-4 h-4 flex-shrink-0" />
                              <span className="line-clamp-1">{section.title}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </ScrollArea>
                </nav>
              </div>
            </aside>

            {/* Content */}
            <div className="lg:col-span-3">
              <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                <Accordion type="multiple" className="w-full space-y-4">
                  {/* 1. Introducción */}
                  <AccordionItem value="introduccion" id="introduccion" className="border border-border rounded-lg px-6">
                    <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-[hsl(210,100%,31%)] hover:no-underline">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[hsl(210,100%,31%)]" />
                        <span>1. Introducción y Definiciones</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-base leading-relaxed text-muted-foreground pt-4">
                      <p className="mb-4">
                        <strong>TecWork</strong> es una plataforma digital intermediaria que conecta a <strong>Clientes</strong> 
                        (hogares, empresas y organizaciones) con <strong>Técnicos</strong> especializados en servicios eléctricos, 
                        gasfitería, climatización y otras áreas técnicas.
                      </p>
                      <p className="mb-4">
                        Al registrarse y utilizar TecWork, usted acepta estos Términos y Condiciones en su totalidad. 
                        Si no está de acuerdo con alguna de estas cláusulas, deberá abstenerse de utilizar la plataforma.
                      </p>
                      <p>
                        TecWork actúa exclusivamente como intermediario tecnológico, facilitando la conexión entre las partes, 
                        pero no ejecuta directamente los servicios técnicos contratados.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 2. Marco Legal */}
                  <AccordionItem value="marco-legal" id="marco-legal" className="border border-border rounded-lg px-6">
                    <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-[hsl(210,100%,31%)] hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Scale className="w-5 h-5 text-[hsl(210,100%,31%)]" />
                        <span>2. Marco Legal Aplicable</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-base leading-relaxed text-muted-foreground pt-4">
                      <p className="mb-4">
                        Estos términos se rigen por las leyes de la <strong>República de Chile</strong>, específicamente:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>
                          <strong>Ley N° 19.496</strong> sobre Protección de los Derechos de los Consumidores, 
                          que regula las relaciones entre proveedores y consumidores.
                        </li>
                        <li>
                          <strong>Ley N° 19.628</strong> sobre Protección de la Vida Privada, que establece normas 
                          para el tratamiento de datos personales.
                        </li>
                      </ul>
                      <p>
                        Cualquier controversia derivada de estos términos será sometida a la jurisdicción de los 
                        tribunales competentes de Chile.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 3. Registro */}
                  <AccordionItem value="registro" id="registro" className="border border-border rounded-lg px-6">
                    <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-[hsl(210,100%,31%)] hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-[hsl(210,100%,31%)]" />
                        <span>3. Registro de Usuario</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-base leading-relaxed text-muted-foreground pt-4">
                      <p className="mb-4">
                        Para acceder a los servicios de TecWork, los usuarios deben:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>Ser mayor de 18 años o contar con autorización de un tutor legal.</li>
                        <li>Proporcionar información veraz, completa y actualizada (nombre, RUT, correo electrónico, teléfono).</li>
                        <li>Crear una contraseña segura y mantener la confidencialidad de sus credenciales.</li>
                        <li>Notificar de inmediato a TecWork cualquier uso no autorizado de su cuenta.</li>
                      </ul>
                      <p>
                        El usuario es responsable de todas las actividades realizadas bajo su cuenta. 
                        TecWork se reserva el derecho de suspender o eliminar cuentas que infrinjan estos términos.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 4. Validación de Técnicos */}
                  <AccordionItem value="validacion" id="validacion" className="border border-border rounded-lg px-6">
                    <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-[hsl(210,100%,31%)] hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-[hsl(210,100%,31%)]" />
                        <span>4. Validación de Técnicos</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-base leading-relaxed text-muted-foreground pt-4">
                      <p className="mb-4">
                        TecWork realiza un proceso de validación de los técnicos que incluye:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>Verificación de identidad mediante RUT y cédula de identidad.</li>
                        <li>Validación de certificaciones técnicas emitidas por la Superintendencia de Electricidad y Combustibles (SEC) u organismos competentes.</li>
                        <li>Revisión de antecedentes y documentación profesional.</li>
                      </ul>
                      <p className="mb-4">
                        <strong>Importante:</strong> Si bien TecWork verifica la documentación de los técnicos, 
                        la <strong>responsabilidad final por la ejecución y calidad del trabajo</strong> recae 
                        en el técnico contratado. TecWork no se hace responsable por daños, pérdidas o 
                        incumplimientos derivados del servicio prestado.
                      </p>
                      <p>
                        Los clientes tienen derecho a calificar y reportar incidencias a través del sistema de 
                        la plataforma.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 5. Pagos y Pago Protegido */}
                  <AccordionItem value="pagos" id="pagos" className="border border-border rounded-lg px-6">
                    <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-[hsl(210,100%,31%)] hover:no-underline">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-[hsl(210,100%,31%)]" />
                        <span>5. Sistema de Pagos y Pago Protegido</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-base leading-relaxed text-muted-foreground pt-4">
                      <p className="mb-4">
                        TecWork implementa un sistema de <strong>"Pago Protegido"</strong> diseñado para garantizar 
                        la seguridad tanto del cliente como del técnico. El proceso funciona de la siguiente manera:
                      </p>
                      <ol className="list-decimal pl-6 space-y-3 mb-4">
                        <li>
                          <strong>Pago del Cliente:</strong> El cliente realiza el pago mediante 
                          <strong> Transbank (WebPay)</strong>, utilizando tarjetas de crédito o débito.
                        </li>
                        <li>
                          <strong>Retención de Fondos:</strong> TecWork retiene el monto pagado en una cuenta 
                          de custodia (escrow) hasta que se complete el servicio.
                        </li>
                        <li>
                          <strong>Confirmación del Trabajo:</strong> Una vez finalizado el trabajo, el cliente 
                          debe confirmar a través de la plataforma que el servicio fue ejecutado satisfactoriamente.
                        </li>
                        <li>
                          <strong>Liberación de Fondos:</strong> Tras la confirmación del cliente, TecWork libera 
                          el pago al técnico, descontando las comisiones correspondientes.
                        </li>
                      </ol>
                      <p className="mb-4">
                        <strong>Seguridad de Pagos:</strong> Todos los pagos son procesados mediante 
                        plataformas certificadas (Transbank), cumpliendo con los estándares de seguridad PCI-DSS. 
                        TecWork no almacena información de tarjetas de crédito.
                      </p>
                      <p>
                        En caso de disputa, los fondos permanecerán retenidos hasta que se resuelva mediante el 
                        sistema de mediación de TecWork.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 6. Comisiones */}
                  <AccordionItem value="comisiones" id="comisiones" className="border border-border rounded-lg px-6">
                    <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-[hsl(210,100%,31%)] hover:no-underline">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[hsl(210,100%,31%)]" />
                        <span>6. Comisiones de Servicio</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-base leading-relaxed text-muted-foreground pt-4">
                      <p className="mb-4">
                        TecWork cobra una <strong>comisión de servicio</strong> por cada transacción exitosa 
                        realizada a través de la plataforma. Esta comisión cubre:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>Mantenimiento y desarrollo de la plataforma tecnológica.</li>
                        <li>Validación y verificación de técnicos.</li>
                        <li>Sistema de pago protegido y custodia de fondos.</li>
                        <li>Soporte al cliente y mediación en caso de disputas.</li>
                      </ul>
                      <p className="mb-4">
                        La comisión está <strong>incluida en el precio final</strong> que el cliente paga al 
                        aceptar una cotización. Los técnicos reciben el monto acordado menos la comisión de TecWork.
                      </p>
                      <p>
                        Los porcentajes de comisión pueden variar según el tipo de servicio y serán informados 
                        claramente antes de confirmar la transacción.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 7. Prohibiciones */}
                  <AccordionItem value="prohibiciones" id="prohibiciones" className="border border-border rounded-lg px-6">
                    <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-[hsl(210,100%,31%)] hover:no-underline">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-[hsl(210,100%,31%)]" />
                        <span>7. Prohibición de Operaciones Fuera de la Plataforma</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-base leading-relaxed text-muted-foreground pt-4">
                      <p className="mb-4">
                        Queda <strong>estrictamente prohibido</strong> que clientes y técnicos intercambien 
                        información de contacto personal (números de teléfono, direcciones, correos electrónicos, 
                        redes sociales) con el fin de realizar transacciones fuera de TecWork para evitar el pago 
                        de comisiones.
                      </p>
                      <p className="mb-4">
                        <strong>Consecuencias del incumplimiento:</strong>
                      </p>
                      <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>Suspensión inmediata de la cuenta del usuario infractor.</li>
                        <li>Eliminación permanente de la plataforma en caso de reincidencia.</li>
                        <li>Posible acción legal para recuperar comisiones no pagadas.</li>
                      </ul>
                      <p>
                        Esta política protege la integridad de la plataforma y garantiza que todos los usuarios 
                        se beneficien del sistema de pago protegido, validación de técnicos y mediación de disputas.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 8. Privacidad */}
                  <AccordionItem value="privacidad" id="privacidad" className="border border-border rounded-lg px-6">
                    <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-[hsl(210,100%,31%)] hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-[hsl(210,100%,31%)]" />
                        <span>8. Privacidad y Protección de Datos Personales</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-base leading-relaxed text-muted-foreground pt-4">
                      <p className="mb-4">
                        TecWork se compromete a proteger la privacidad de sus usuarios en cumplimiento con la 
                        <strong> Ley N° 19.628 sobre Protección de la Vida Privada</strong>.
                      </p>
                      <p className="mb-4">
                        <strong>Datos recopilados:</strong>
                      </p>
                      <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>Información personal: Nombre, RUT, dirección, teléfono, correo electrónico.</li>
                        <li>Información de transacciones: Historial de servicios, pagos y calificaciones.</li>
                        <li>Datos técnicos: Certificaciones profesionales (solo para técnicos).</li>
                      </ul>
                      <p className="mb-4">
                        <strong>Uso de los datos:</strong>
                      </p>
                      <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>Facilitar la conexión entre clientes y técnicos.</li>
                        <li>Procesar pagos y transacciones.</li>
                        <li>Validar identidad y credenciales de técnicos.</li>
                        <li>Enviar notificaciones sobre servicios contratados.</li>
                        <li>Mejorar la experiencia del usuario mediante análisis de datos.</li>
                      </ul>
                      <p>
                        TecWork <strong>no compartirá</strong> datos personales con terceros sin consentimiento 
                        expreso del usuario, salvo cuando sea requerido por ley o autoridad competente.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 9. Disputas */}
                  <AccordionItem value="disputas" id="disputas" className="border border-border rounded-lg px-6">
                    <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-[hsl(210,100%,31%)] hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Gavel className="w-5 h-5 text-[hsl(210,100%,31%)]" />
                        <span>9. Resolución de Disputas y Mediación</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-base leading-relaxed text-muted-foreground pt-4">
                      <p className="mb-4">
                        En caso de desacuerdos entre clientes y técnicos (por ejemplo, sobre la calidad del trabajo, 
                        cumplimiento de plazos o especificaciones del servicio), TecWork ofrece un 
                        <strong> sistema de mediación gratuito</strong>.
                      </p>
                      <p className="mb-4">
                        <strong>Proceso de mediación:</strong>
                      </p>
                      <ol className="list-decimal pl-6 space-y-2 mb-4">
                        <li>El usuario afectado reporta la disputa a través de la plataforma.</li>
                        <li>TecWork revisa la evidencia presentada por ambas partes (fotos, mensajes, cotizaciones).</li>
                        <li>Se emite una resolución basada en los términos del servicio acordado y las políticas de la plataforma.</li>
                        <li>Si la disputa no se resuelve mediante mediación, las partes pueden recurrir a los tribunales competentes de Chile.</li>
                      </ol>
                      <p>
                        Durante el proceso de mediación, los fondos permanecerán retenidos en la cuenta de custodia 
                        hasta que se alcance una resolución.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 10. Contacto */}
                  <AccordionItem value="contacto" id="contacto" className="border border-border rounded-lg px-6">
                    <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-[hsl(210,100%,31%)] hover:no-underline">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[hsl(210,100%,31%)]" />
                        <span>10. Contacto y Consultas</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-base leading-relaxed text-muted-foreground pt-4">
                      <p className="mb-4">
                        Para consultas, soporte técnico o preguntas sobre estos Términos y Condiciones, 
                        puede contactarnos a través de:
                      </p>
                      <div className="bg-accent/50 border border-border rounded-lg p-4">
                        <p className="mb-2">
                          <strong>Correo electrónico:</strong>{" "}
                          <a href="mailto:soporte@tecwork.cl" className="text-[hsl(210,100%,31%)] hover:underline">
                            soporte@tecwork.cl
                          </a>
                        </p>
                        <p className="mb-2">
                          <strong>Plataforma:</strong> Sistema de mensajería interno de TecWork
                        </p>
                        <p>
                          <strong>Horario de atención:</strong> Lunes a viernes, 9:00 - 18:00 hrs (hora de Chile)
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Footer Note */}
                <div className="mt-8 p-6 bg-accent/50 border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <strong>Nota Legal:</strong> Al utilizar TecWork, usted reconoce haber leído, comprendido 
                    y aceptado estos Términos y Condiciones en su totalidad. TecWork se reserva el derecho de 
                    modificar estos términos en cualquier momento, notificando a los usuarios registrados a 
                    través de correo electrónico o mediante avisos en la plataforma.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TerminosCondiciones;
