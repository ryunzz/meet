import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-muted-foreground mb-8">
        This meeting type doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground h-10 px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Go back home
      </Link>
    </div>
  );
}
