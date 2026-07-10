import { useState } from 'react'
import { ExternalLinkIcon, FileTextIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

type LagenhetPlanlosningSheetProps = {
  planlosningUrl: string
  adress: string
}

export function LagenhetPlanlosningSheet({
  planlosningUrl,
  adress,
}: LagenhetPlanlosningSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Visa planlösning
        <FileTextIcon />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex h-full flex-col gap-0 p-0 data-[side=right]:w-[75vw] data-[side=right]:max-w-[75vw] data-[side=right]:sm:max-w-[75vw]">
          <SheetHeader className="border-b p-4">
            <SheetTitle>Planlösning</SheetTitle>
            <SheetDescription>{adress}</SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col p-4">
            <iframe
              src={planlosningUrl}
              title={`Planlösning för ${adress}`}
              className="min-h-0 flex-1 rounded-lg border bg-muted"
            />
          </div>

          <SheetFooter className="border-t p-4">
            <Button
              variant="outline"
              render={
                <a href={planlosningUrl} target="_blank" rel="noopener noreferrer" />
              }
            >
              Öppna i ny flik
              <ExternalLinkIcon />
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
