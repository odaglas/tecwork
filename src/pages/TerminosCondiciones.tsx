import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield, FileText, AlertCircle } from "lucide-react";

const TerminosCondiciones = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-6">Términos y Condiciones</h1>
          
          <div className="bg-accent/50 border border-border rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Última actualización: {new Date().toLocaleDateString('es-CL')}
              </p>
            </div>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            <section className="bg-card border border-border rounded-lg p-8">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground m-0">1. Aceptación de Términos</h2>
              </div>
              <p className="text-muted-foreground">
                Al acceder y utilizar la plataforma TecWork, usted acepta estar sujeto a estos términos y condiciones. 
                Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.
              </p>
            </section>

            <section className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Descripción del Servicio</h2>
              <p className="text-muted-foreground mb-4">
                TecWork es una plataforma que conecta clientes con técnicos profesionales validados. Facilitamos:
              </p>
              <ul className="text-muted-foreground space-y-2">
                <li>Publicación de solicitudes de servicio (tickets)</li>
                <li>Cotizaciones de técnicos validados</li>
                <li>Sistema de pagos seguros</li>
                <li>Sistema de calificaciones y reseñas</li>
              </ul>
            </section>

            <section className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Registro de Usuario</h2>
              <p className="text-muted-foreground mb-4">
                Para utilizar TecWork, debe:
              </p>
              <ul className="text-muted-foreground space-y-2">
                <li>Proporcionar información precisa y actualizada</li>
                <li>Mantener la seguridad de su cuenta y contraseña</li>
                <li>Notificar inmediatamente cualquier uso no autorizado</li>
                <li>Ser mayor de 18 años</li>
              </ul>
            </section>

            <section className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Validación de Técnicos</h2>
              <p className="text-muted-foreground">
                Todos los técnicos en la plataforma pasan por un proceso de validación que incluye verificación 
                de documentación y credenciales. Sin embargo, TecWork actúa como intermediario y no se hace 
                responsable directo de la calidad del trabajo realizado.
              </p>
            </section>

            <section className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Pagos y Transacciones</h2>
              <p className="text-muted-foreground mb-4">
                El sistema de pagos funciona de la siguiente manera:
              </p>
              <ul className="text-muted-foreground space-y-2">
                <li>Los pagos se retienen de forma segura hasta la finalización del servicio</li>
                <li>El cliente debe confirmar la satisfacción del trabajo</li>
                <li>Los fondos se liberan al técnico tras la confirmación</li>
                <li>Las disputas se manejan a través de nuestro sistema de mediación</li>
              </ul>
            </section>

            <section className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Responsabilidades del Usuario</h2>
              <p className="text-muted-foreground mb-4">
                Los usuarios se comprometen a:
              </p>
              <ul className="text-muted-foreground space-y-2">
                <li>Proporcionar información veraz en las solicitudes de servicio</li>
                <li>Respetar los acuerdos establecidos con los técnicos</li>
                <li>No usar la plataforma para actividades ilegales</li>
                <li>Mantener un comportamiento profesional y respetuoso</li>
              </ul>
            </section>

            <section className="bg-card border border-border rounded-lg p-8">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground m-0">7. Privacidad y Protección de Datos</h2>
              </div>
              <p className="text-muted-foreground">
                Nos comprometemos a proteger su información personal de acuerdo con las leyes de protección 
                de datos vigentes en Chile. Los datos personales solo se utilizarán para facilitar los 
                servicios de la plataforma y no se compartirán con terceros sin consentimiento.
              </p>
            </section>

            <section className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Limitación de Responsabilidad</h2>
              <p className="text-muted-foreground">
                TecWork actúa como plataforma intermediaria. No nos hacemos responsables de daños directos o 
                indirectos resultantes del uso de nuestros servicios, la calidad del trabajo de los técnicos, 
                o disputas entre usuarios.
              </p>
            </section>

            <section className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Modificaciones</h2>
              <p className="text-muted-foreground">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios 
                serán notificados a través de la plataforma y entrarán en vigor inmediatamente después 
                de su publicación.
              </p>
            </section>

            <section className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contacto</h2>
              <p className="text-muted-foreground">
                Para preguntas sobre estos términos y condiciones, puede contactarnos en:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: <a href="mailto:soporte@tecwork.cl" className="text-primary hover:underline">soporte@tecwork.cl</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TerminosCondiciones;
