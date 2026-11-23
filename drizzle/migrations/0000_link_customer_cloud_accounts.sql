ALTER TABLE public.customer_accounts ADD COLUMN auth_user_id uuid;
CREATE UNIQUE INDEX customer_accounts_auth_user_id_key ON public.customer_accounts(auth_user_id);
COMMENT ON COLUMN public.customer_accounts.auth_user_id IS 'Verified Cloud Auth identity; assigned only by authenticated customer server functions.';