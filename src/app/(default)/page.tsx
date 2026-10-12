import DownloadAppsSection from "@/components/home/DownloadAppsSection";
import GamesSection from "@/components/home/GameSection";
import HeroSection from "@/components/home/HeroSection";

function page() {
  return (
    <div>
      <HeroSection />
      <GamesSection/> 
      <DownloadAppsSection />
    </div>
  );
}

export default page;
