import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { UserAvatarMenu } from "./UserAvatarMenu";

interface Props {
  name: string | null;
  subtitle?: string | null;
  image: string | null;
  showSettingsButton?: boolean;
}

export function AppHeader({ name, subtitle, image, showSettingsButton }: Props) {
  return (
    <header className="w-full border-b border-hairline bg-surface/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo lockup */}
        <Link href="/dashboard" className="flex items-center gap-2.5 min-h-11">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-sunrise flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-ink text-sm font-bold leading-none">Dottd</p>
            {subtitle && (
              <p className="text-mist text-xs leading-none mt-0.5 truncate max-w-[140px]">
                {subtitle}
              </p>
            )}
          </div>
        </Link>

        {/* Right — avatar dropdown + optional Settings button */}
        <UserAvatarMenu
          name={name}
          image={image}
          showSettingsButton={showSettingsButton}
        />
      </div>
    </header>
  );
}
