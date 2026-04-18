import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  textColor?: "default" | "light";
}

export const Logo = ({ size = "md", showText = true, textColor = "default" }: LogoProps) => {
  const sizes = {
    sm: { img: "h-8 w-8", title: "text-base", subtitle: "text-[10px]" },
    md: { img: "h-10 w-10", title: "text-lg", subtitle: "text-xs" },
    lg: { img: "h-14 w-14", title: "text-2xl", subtitle: "text-sm" },
  };
  const s = sizes[size];

  return (
    <Link to="/" className="flex items-center gap-3 group">
      <img
        src={logo}
        alt="Logo Cours Secondaire Elites Divo"
        className={`${s.img} object-contain transition-smooth group-hover:scale-105`}
        width={56}
        height={56}
      />
      {showText && (
        <div className="leading-tight">
          <div
            className={`font-display font-bold ${s.title} ${
              textColor === "light" ? "text-white" : "text-foreground"
            }`}
          >
            Elites Divo
          </div>
          <div
            className={`${s.subtitle} font-medium tracking-wide ${
              textColor === "light" ? "text-white/80" : "text-muted-foreground"
            }`}
          >
            COURS SECONDAIRE
          </div>
        </div>
      )}
    </Link>
  );
};
