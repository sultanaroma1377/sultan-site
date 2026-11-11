CREATE TABLE public.shop_data (
  key text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.shop_data TO service_role;
ALTER TABLE public.shop_data ENABLE ROW LEVEL SECURITY;