import { AppContent} from "./components/content"
import { AppHeader } from "./components/header"

export default function Home() {
  return (
    <div className="min-h-screen">
        <AppHeader />
        <main className="flex items-center justify-cente">
            <AppContent />
        </main>
    </div>
  );
}
