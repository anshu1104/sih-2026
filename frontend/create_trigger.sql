CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_reports_modtime ON public.reports;

CREATE TRIGGER update_reports_modtime
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
