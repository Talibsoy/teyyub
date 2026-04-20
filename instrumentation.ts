export async function register() {
  // NODE_TLS_REJECT_UNAUTHORIZED='0' kim tərəfindən set edilir — tapırıq
  const current = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if (current === "0") {
    console.error("[TLS] Startup-da artıq '0' set olunub — Vercel env var-da axtarın");
  }

  // Proxy ilə dəyişimi izlə
  const handler: ProxyHandler<typeof process.env> = {
    set(target, prop, value) {
      if (prop === "NODE_TLS_REJECT_UNAUTHORIZED" && value === "0") {
        const err = new Error("[TLS] NODE_TLS_REJECT_UNAUTHORIZED=0 SET EDİLİR");
        console.error(err.stack);
      }
      return Reflect.set(target, prop, value);
    },
  };
  // @ts-ignore
  process.env = new Proxy(process.env, handler);
}
