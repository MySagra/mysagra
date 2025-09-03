import { Button, buttonVariants } from "./button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"

import { VariantProps } from "class-variance-authority";
import { useTranslations } from "next-intl";

interface DialogActionProps {
    children?: React.ReactNode
    title: string
    buttonText: string
    variant?: VariantProps<typeof buttonVariants>['variant'];
    action?: () => void;
    trigger: React.ReactNode
}

export function DialogAction({ children, trigger, title, buttonText, variant, action }: DialogActionProps) {

    const t = useTranslations('Utils')

    return (
        <Dialog>
            <DialogTrigger asChild>
                { trigger }
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {title}
                    </DialogTitle>
                    <DialogDescription />
                </DialogHeader>
                {children}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant={"outline"}>
                            {t('cancel')}
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button variant={variant} onClick={action}>
                            {buttonText}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}