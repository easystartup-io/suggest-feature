import { cn } from "@/lib/utils"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { ArrowUpDown, Check } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const sortOptions = [
  {
    value: "trending",
    label: "Trending",
  },
  {
    value: "top",
    label: "Top",
  },
  {
    value: "newest",
    label: "Newest",
  },
  {
    value: "oldest",
    label: "Oldest",
  }
]

export function SortOptionsComboBox({ postsSort, setPostsSort }) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-1/2 justify-between"
        >
          {postsSort
            ? sortOptions.find((framework) => framework.value === postsSort)?.label
            : "Trending"}
          <ArrowUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0">
        <Command>
          <CommandInput placeholder="Search sort..." />
          <CommandList>
            <CommandEmpty>No sort found.</CommandEmpty>
            <CommandGroup>
              {sortOptions.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={(currentValue) => {
                    setPostsSort(currentValue === postsSort ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      postsSort === framework.value ? "opacity-100" : "opacity-0"
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
