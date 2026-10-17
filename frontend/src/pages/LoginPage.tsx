import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, CircleAlert, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ApiRequestError } from '@/api/client'
import { useAuth } from '@/auth/AuthProvider'
import { IstClock } from '@/components/app/IstClock'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { Wordmark } from '@/components/shell/Wordmark'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const loginSchema = z.object({
  username: z.string().trim().min(1, { error: 'Enter your username' }),
  password: z.string().min(1, { error: 'Enter your password' }).max(72, { error: 'Passwords are at most 72 characters' }),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { username: '', password: '' } })
  const from = (location.state as { from?: string } | null)?.from ?? '/home'

  if (status === 'authenticated') return <Navigate to={from} replace />

  const onSubmit = form.handleSubmit(async ({ username, password }) => {
    setFailure(null)
    try {
      await login(username, password)
      navigate(from, { replace: true })
    } catch (error) {
      setFailure(
        error instanceof ApiRequestError && error.status === 401
          ? 'Invalid username or password'
          : 'Settle could not be reached. Try again in a moment.',
      )
    }
  })

  const fieldClass = 'h-[46px] rounded-md bg-card px-3.5 text-[15px] md:text-[15px]'

  return (
    <div className="flex min-h-screen flex-wrap bg-background text-[14px] text-foreground">
      <div className="flex min-h-screen min-w-0 flex-[1_1_460px] flex-col gap-6 px-6 py-7 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" aria-label="Settle website" className="text-foreground hover:no-underline">
            <Wordmark size={28} />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-muted-foreground hover:bg-muted hover:no-underline"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Back to website
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <div className="grid flex-1 place-items-center">
          <Form {...form}>
            <form onSubmit={onSubmit} noValidate className="flex w-full max-w-[380px] flex-col gap-5">
              <div className="flex flex-col gap-2.5">
                <h1 className="text-[64px] leading-[0.9] font-[750] tracking-[-0.01em]" style={{ fontStretch: '62%' }}>
                  Log in
                </h1>
                <p className="text-[15px] text-muted-foreground">Use the username and password your admin gave you.</p>
              </div>

              {failure && (
                <div role="alert" className="flex items-center gap-2.5 rounded-md bg-sev-1-bg px-3.5 py-3 text-sm font-semibold text-sev-1-fg">
                  <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                  {failure}
                </div>
              )}

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Username</FormLabel>
                    <FormControl>
                      <Input autoComplete="username" className={fieldClass} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Password</FormLabel>
                    <div className="relative flex items-center">
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          className={`${fieldClass} pr-12`}
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword((shown) => !shown)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-1.5 grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted"
                      >
                        {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={form.formState.isSubmitting} className="h-12 rounded-md text-[15px] font-bold">
                {form.formState.isSubmitting ? 'Logging in…' : 'Log in'}
              </Button>

              <div className="flex items-start gap-2.5 rounded-md bg-muted px-4 py-3.5 text-[13.5px] text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-[15px] shrink-0" aria-hidden="true" />
                <span className="text-pretty">There's no sign-up. Accounts are created by an admin. If you need one, ask your admin.</span>
              </div>
            </form>
          </Form>
        </div>

        <div className="text-[12.5px] text-muted-foreground">IT314 course project, Group 2</div>
      </div>

      <div className="dark relative isolate hidden min-h-screen min-w-0 flex-[1_1_460px] flex-col items-center justify-center gap-9 overflow-hidden bg-deep p-12 text-foreground lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 [background-image:radial-gradient(oklch(1_0_0/0.09)_1px,transparent_1.2px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_45%,black_30%,transparent_75%)]"
        />
        <IstClock />
        <div className="flex max-w-[460px] flex-col items-center gap-3.5 text-center">
          <h2 className="text-[52px] leading-[0.9] font-[750]" style={{ fontStretch: '62%' }}>
            Every incident runs on a clock.
          </h2>
          <p className="text-[15px] text-pretty text-muted-foreground">
            After you log in you land on your work: incidents you're in, alerts routed to you, and your on-call shift.
          </p>
        </div>
      </div>
    </div>
  )
}
