import { cn } from "@/lib/utils"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { Check, Filter, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { statusConfig } from "@/components/post/PostsScreen"

const getFilterLabel = (value) => {
  return statusConfig[value]?.label
}

export function StatusFilterComboBox({ postsStatusFilter, setPostsStatusFilter }) {
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
          {getFilterLabel(postsStatusFilter) || 'All status'}
          <div className="flex items-center">
            {/* Filter icon */}
            <Filter className="h-4 w-4 shrink-0 opacity-50 mr-2" />
            {/* X button to clear filter */}
            {postsStatusFilter && (
              <X
                className="h-4 w-4 shrink-0 cursor-pointer text-red-500"
                onClick={(e) => {
                  e.stopPropagation(); // Prevents the popover from toggling
                  setPostsStatusFilter("");
                }}
              />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search sort..." />
          <CommandList>
            <CommandEmpty>No sort found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value=""
                onSelect={() => {
                  setPostsStatusFilter("")
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    postsStatusFilter === "" ? "opacity-100" : "opacity-0"
                  )}
                />
                All status
              </CommandItem>
              {Object.keys(statusConfig).map((key) => {

                const framework = statusConfig[key];
                return <CommandItem
                  key={key}
                  value={key}
                  onSelect={(currentValue) => {
                    setPostsStatusFilter(currentValue === postsStatusFilter ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      postsStatusFilter === framework.key ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {framework.label}
                </CommandItem>
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
