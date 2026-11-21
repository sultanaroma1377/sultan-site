import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { store, useStore } from "@/lib/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { signInCustomer, signOutCustomer } from "@/lib/customer-sync";
import { Button } from "@/components/ui/button";

export function UserHeader() {
  const site = useStore((s) => s.site);
  const cartCount = useStore((s) => {
    const cust = s.customers.find((c) => c.id === s.currentCustomerId);
    return cust?.cart.filter((i) => !i.savedForLater).reduce((a, b) => a + b.qty, 0) ?? 0;
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          {site.logo ? (
            <img src={site.logo} alt={site.name} className="h-10 w-auto max-w-[160px] object-contain" />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary font-serif text-lg">
              {site.name?.[0] ?? "M"}
            </span>
          )}
          <span className="min-w-0 break-words font-brand text-xl sm:text-2xl">{site.name}</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-on-gradient/15">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Link>
          <AccountSheet />
        </div>
      </div>
    </header>
  );
}

function AccountSheet() {
  const [open, setOpen] = useState(false);
  const current = useStore((s) => s.customers.find((c) => c.id === s.currentCustomerId) ?? null);
  const [mode, setMode] = useState<"menu" | "login" | "signup">("menu");
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  const close = () => {
    setOpen(false);
    setMode("menu");
    setU("");
    setP("");
    setErr("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto border-border bg-card text-foreground sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">
            {current ? `Hello, ${current.username}` : "Welcome"}
          </SheetTitle>
        </SheetHeader>

        {mode === "menu" && (
          <div className="mt-6 space-y-2 px-4">
            <Link to="/" onClick={close} className="block rounded-md px-3 py-2 hover:bg-on-gradient/15">Home</Link>
            <Link to="/products" search={{ q: "" }} onClick={close} className="block rounded-md px-3 py-2 hover:bg-on-gradient/15">Shop</Link>
            <Link to="/favorites" onClick={close} className="block rounded-md px-3 py-2 hover:bg-on-gradient/15">Favorites</Link>
            <Link to="/cart" onClick={close} className="block rounded-md px-3 py-2 hover:bg-on-gradient/15">Cart</Link>
            <Link to="/admin" onClick={close} className="block rounded-md px-3 py-2 hover:bg-on-gradient/15">Admin</Link>
            <div className="my-3 h-px bg-border" />
            {current ? (
              <>
                <Link to="/account" onClick={close} className="block px-3 py-2">Account details</Link>
                <Link to="/orders" onClick={close} className="block px-3 py-2">Orders</Link>
                <button
                  onClick={() => {
                    void signOutCustomer().then(close).catch(() => setErr("Could not logout; try again"));
                  }}
                  className="block w-full rounded-md px-3 py-2 text-left hover:bg-on-gradient/15"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setMode("login")} className="block w-full rounded-md px-3 py-2 text-left hover:bg-on-gradient/15">Login</button>
                <button onClick={() => setMode("signup")} className="block w-full rounded-md px-3 py-2 text-left hover:bg-on-gradient/15">Create account</button>
              </>
            )}
          </div>
        )}

        {(mode === "login" || mode === "signup") && (
          <form
            className="mt-6 space-y-3 px-4"
            onSubmit={(e) => {
              e.preventDefault();
              setErr("");
              void signInCustomer(u, p, mode === "signup").then(close).catch(error => setErr(error instanceof Error ? error.message : "Could not sign in"));
            }}
          >
            <h3 className="font-serif text-xl">{mode === "login" ? "Login" : "Create account"}</h3>
            <input className="w-full rounded-md border bg-background px-3 py-2" placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} required />
            <input className="w-full rounded-md border bg-background px-3 py-2" type="password" minLength={6} placeholder="Password" value={p} onChange={(e) => setP(e.target.value)} required />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" className="w-full">{mode === "login" ? "Login" : "Sign up"}</Button>
            <button type="button" onClick={() => setMode("menu")} className="block w-full text-sm text-muted-foreground hover:underline">Back</button>
          </form>
        )}

      </SheetContent>
    </Sheet>
  );
}
