import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";

interface TermsCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
}

export const TermsCheckbox = ({ checked, onCheckedChange, error }: TermsCheckboxProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-3">
        <Checkbox
          id="terms"
          checked={checked}
          onCheckedChange={(checked) => onCheckedChange(checked === true)}
          className={error ? "border-destructive" : ""}
        />
        <label
          htmlFor="terms"
          className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
        >
          Acepto los{" "}
          <Link
            to="/terminos-condiciones"
            target="_blank"
            className="text-primary hover:underline font-medium"
          >
            Términos y Condiciones
          </Link>{" "}
          de TecWork
        </label>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
