// Import clinical images from assets
import generalEye from "@/assets/general-eye.jpg";
import contactLens from "@/assets/contact-lens-services.jpg";
import glaucomaScreening from "@/assets/public-eye-health.jpg";
import dvlaTest from "@/assets/dvla-eye-testing.jpg";
import binocularVision from "@/assets/binocular-vision-services.jpg";
import corporateHealth from "@/assets/corporate-eye-health-services.jpg";
import lowVision from "@/assets/low-vision-rehabilitation.jpg";
import publicHealth from "@/assets/public-eye-health.jpg";

export const serviceImageMap: Record<string, string> = {
  "general-eye-examination": generalEye,
  "contact-lens-fitting": contactLens,
  "glaucoma-screening": glaucomaScreening,
  "dvla-eye-test": dvlaTest,
  "binocular-vision-services": binocularVision,
  "corporate-eye-health": corporateHealth,
  "low-vision-rehabilitation": lowVision,
  "public-eye-health": publicHealth,
};
