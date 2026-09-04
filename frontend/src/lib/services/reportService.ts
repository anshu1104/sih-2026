import { supabase } from "../supabase";
import { ReportLocation } from "@/app/report/page";

// Service to handle Supabase interactions for Reports
export const reportService = {
  
  // Create a new report
  async createReport(
    userId: string, // Kept for backwards compatibility but we'll fetch from auth
    location: ReportLocation, 
    imageFile: File, 
    detections: any[], 
    priority: string = 'normal',
    description: string = ''
  ) {
    try {
      // ALWAYS use the securely authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "You must be logged in to submit a report." };
      }
      const secureUserId = user.id;
      const safePriority = priority.toLowerCase();

      // 1. Upload image to Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${secureUserId}/${fileName}`;
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('civicvision-reports')
        .upload(filePath, imageFile);
        
      if (storageError) throw storageError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('civicvision-reports')
        .getPublicUrl(filePath);

      // 2. Insert Report Record
      const reportIdString = `CV-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Calculate highest confidence waste type
      const wasteType = detections.length > 0 
        ? detections.sort((a, b) => b.confidence - a.confidence)[0].class_name 
        : 'Unknown';

      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .insert([{
          report_id: reportIdString,
          user_id: secureUserId,
          waste_type: wasteType,
          description: description,
          priority: safePriority,
          status: 'pending',
          latitude: location.latitude || 0,
          longitude: location.longitude || 0,
          address: location.address || null,
          ai_verified: true,
          object_count: detections.length
        }])
        .select()
        .single();
        
      if (reportError) throw reportError;

      // 3. Insert Detections
      if (detections.length > 0) {
        const detectionsToInsert = detections.map(d => ({
          report_id: reportData.id,
          class_name: d.class_name,
          confidence: d.confidence,
          x1: d.box[0],
          y1: d.box[1],
          x2: d.box[2],
          y2: d.box[3]
        }));
        
        await supabase.from('detections').insert(detectionsToInsert);
      }

      // 4. Insert Media Record
      await supabase.from('report_media').insert({
        report_id: reportData.id,
        media_type: 'original',
        storage_path: publicUrl
      });

      return { success: true, report: reportData };
      
    } catch (error: any) {
      console.error("Error creating report:", error);
      return { success: false, error: error.message };
    }
  },

  // Fetch reports for citizen
  async getCitizenReports(userId: string) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  },

  // Fetch all reports for admin
  async getAllReports() {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        profiles:user_id(full_name, email)
      `)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  },

  // Get single report by text ID or UUID
  async getReportById(id: string) {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        detections(*),
        report_media(*)
      `)
      .eq('report_id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  // Update report status
  async updateReportStatus(reportId: string, status: string) {
    const { data, error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', reportId)
      .select();
      
    if (error) throw error;
    return data;
  }
};
