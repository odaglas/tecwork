import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TechnicianRegistrationSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <CardTitle className="text-2xl">¡Registro Exitoso!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-primary" />
            </div>
            <p className="text-muted-foreground">
              Tu cuenta de técnico ha sido creada exitosamente.
            </p>
            <p className="text-muted-foreground">
              Por favor revisa tu correo electrónico para confirmar tu cuenta.
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="font-semibold text-foreground">Próximos pasos:</p>
            <ol className="text-sm text-muted-foreground text-left list-decimal list-inside space-y-1">
              <li>Confirma tu correo electrónico</li>
              <li>Espera la validación de un administrador</li>
              <li>Recibirás un correo cuando tu perfil sea aprobado</li>
              <li>Podrás iniciar sesión y comenzar a trabajar</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => navigate("/")}
              className="w-full"
            >
              Volver al Inicio
            </Button>
            <Button
              onClick={() => navigate("/login-tecnico")}
              variant="outline"
              className="w-full"
            >
              Ir al Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicianRegistrationSuccess;
