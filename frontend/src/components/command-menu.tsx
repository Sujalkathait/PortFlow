import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  Anchor,
  Box,
  Cpu,
  FileText,
  HardDrive,
  Home,
  LogOut,
  Plus,
  Play,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  Wrench,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useAuth } from "@/auth/AuthProvider"

interface CommandMenuProps {
  role?: string
}

export function CommandMenu({ role = "Admin" }: CommandMenuProps) {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const basePath = role === "Admin" ? "/admin" : "/operator"

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="relative h-9 w-full justify-start rounded-md bg-muted/40 text-sm font-normal text-muted-foreground shadow-none sm:w-64 sm:pr-12 md:w-80"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search port, ships, actions...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search PortFlow..." />
        <CommandList>
          <CommandEmpty>No matching results found.</CommandEmpty>

          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => navigate(`${basePath}/dashboard`))}>
              <Home className="mr-2 h-4 w-4" />
              <span>Dashboard Overview</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate(`${basePath}/operations`))}>
              <Anchor className="mr-2 h-4 w-4" />
              <span>Active Operations</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate(`${basePath}/ships`))}>
              <Anchor className="mr-2 h-4 w-4" />
              <span>Ships & Berths</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate(`${basePath}/Cargos`))}>
              <Box className="mr-2 h-4 w-4" />
              <span>Cargo Management</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate(`${basePath}/scheduling`))}>
              <Cpu className="mr-2 h-4 w-4" />
              <span>CPU Scheduling & Algorithms</span>
            </CommandItem>
            {role === "Admin" && (
              <>
                <CommandItem onSelect={() => runCommand(() => navigate(`${basePath}/Equipments`))}>
                  <Wrench className="mr-2 h-4 w-4" />
                  <span>Equipment & Cranes</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => navigate(`${basePath}/logs`))}>
                  <HardDrive className="mr-2 h-4 w-4" />
                  <span>System Audit Logs</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => navigate(`${basePath}/reports`))}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Reports & Analytics</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => navigate(`${basePath}/trash`))}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Recycle / Trash Bin</span>
                </CommandItem>
              </>
            )}
            {role === "Operator" && (
              <CommandItem onSelect={() => runCommand(() => navigate(`${basePath}/report-issue`))}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                <span>Report Issue</span>
              </CommandItem>
            )}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => runCommand(() => navigate(`${basePath}/operations`))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>New Operation</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate(`${basePath}/ships`))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Register Vessel / Ship</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate(`${basePath}/Cargos`))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Add Cargo Manifest</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate(`${basePath}/scheduling`))}>
              <Play className="mr-2 h-4 w-4" />
              <span>Run CPU Scheduler Simulation</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="System & Session">
            <CommandItem
              onSelect={() =>
                runCommand(async () => {
                  await signOut()
                  navigate("/login", { replace: true })
                })
              }
            >
              <LogOut className="mr-2 h-4 w-4 text-destructive" />
              <span className="text-destructive">Log out of PortFlow</span>
              <CommandShortcut>⇧⌘Q</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
