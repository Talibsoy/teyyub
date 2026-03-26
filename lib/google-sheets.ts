import { CustomerData } from "@/lib/ai-agent";

export async function addCustomerToSheet(
  platform: string,
  senderId: string,
  customerData: CustomerData,
  message: string
) {
  // Google Sheets inteqrasiyası hələlik deaktivdir
  return;
}
