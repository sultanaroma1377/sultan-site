CREATE TABLE public.customer_accounts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), username text NOT NULL UNIQUE, password_hash text NOT NULL, data jsonb NOT NULL DEFAULT '{"favorites":[],"cart":[],"addresses":[]}'::jsonb, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.customer_accounts TO service_role;
ALTER TABLE public.customer_accounts ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.customer_orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL REFERENCES public.customer_accounts(id), data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.customer_orders TO service_role;
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.shop_sessions (token_hash text PRIMARY KEY, customer_id uuid REFERENCES public.customer_accounts(id), is_admin boolean NOT NULL DEFAULT false, expires_at timestamptz NOT NULL);
GRANT ALL ON public.shop_sessions TO service_role;
ALTER TABLE public.shop_sessions ENABLE ROW LEVEL SECURITY;