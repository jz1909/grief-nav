import { SignInButton } from "@/components/sign-in-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-400 to-blue-300">
        <div className="container relative mx-auto flex min-h-[70vh] flex-col items-center justify-center gap-10 px-6 py-20 text-center">
          <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
            The handling service when you're grieving
          </h1>

          <p className="max-w-2xl text-lg font-medium leading-relaxed text-white/90 sm:text-xl md:text-2xl">
            Alongside helps you organize one's life after they've passed away, so that you can focus on what truly matters.
          </p>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:gap-6">
            <SignInButton />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
              How it works
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
              Get aftercare service in a couple of steps
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group border-0 bg-white shadow-lg shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600">
                Be able to send out email
              </CardContent>
            </Card>

            <Card className="group border-0 bg-white shadow-lg shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Legal assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600">
                Be able to help with post mortem legal stuff
              </CardContent>
            </Card>

            <Card className="group border-0 bg-white shadow-lg shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-slate-900">
                  There is an issue with post-death stuff
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600">
                IF theres an issue, I'll fix it
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
