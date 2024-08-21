"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"


export function ComboboxDemo({ data, setBoards, index, boards }) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [frameworks, setFrameworks] = React.useState([])

  React.useEffect(() => {
    if (!data) {
      return;
    }
    const localFrameworks = []
    // create value label pair similar to frameworks from data.id and data.name
    data.map((item) => {
      localFrameworks.push({ value: item.id, label: item.name, id: item.id })
    })
    setFrameworks(localFrameworks)
    if (boards && boards[index] && boards[index].length > 0) {
      setValue(boards[index])
    }
  }, [data])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? frameworks.find((framework) => framework.value === value)?.label
            : "Select board..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search board..." />
          <CommandList>
            <CommandEmpty>No board found.</CommandEmpty>
            <CommandGroup>
              {frameworks.map((framework) => (
                <CommandItem
                  key={framework.value}
                  onSelect={(currentValue) => {
                    setValue(framework.id === value ? "" : framework.id)
                    setOpen(false);

                    const newBoards = [...boards]
                    newBoards[index] = framework.id
                    setBoards(newBoards)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === framework.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {framework.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
