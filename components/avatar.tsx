import { site } from "@/lib/config";

export function Avatar({ size }: { size: number }) {
  const { name, avatar } = site.owner;

  if (avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatar} alt={name} width={size} height={size} className="rounded-full object-cover" />;
  }

  return (
    <div
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="flex items-center justify-center rounded-full bg-accent-soft font-semibold text-accent"
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
