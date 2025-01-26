import { CreateNoteSchema, createNoteSchema } from "@/lib/validation/note";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import LoadingButton from "./ui/loading-button";
import { useRouter } from "next/navigation";
import { Note } from "@prisma/client";
import { useState } from "react";

interface AddEditNoteDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  noteToEdit?: Note;
}

function AddEditNoteDialog({
  open,
  setOpen,
  noteToEdit,
}: AddEditNoteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  const form = useForm<CreateNoteSchema>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: noteToEdit?.title || "",
      content: noteToEdit?.content || "",
    },
  });
  const { handleSubmit, control, formState, reset } = form;

  async function onSubmit(data: CreateNoteSchema) {
    try {
      if (!!noteToEdit) {
        const res = await fetch("/api/notes", {
          method: "PUT",
          body: JSON.stringify({
            id: noteToEdit.id,
            ...data,
          }),
        });
      } else {
        const res = await fetch("/api/notes", {
          method: "POST",
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Status code: " + res.status);
        reset();
      }

      router.refresh();
      setOpen(false);
    } catch (error) {
      console.error(error);
    }
  }

  async function deleteNote() {
    if (!noteToEdit) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/notes", {
        method: "DELETE",
        body: JSON.stringify({ id: noteToEdit.id }),
      });
      if (!res.ok) throw new Error("Status code: " + res.status);
      router.refresh();
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{noteToEdit ? "Edit" : "Add"} Note</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Note title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Note content" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <LoadingButton
                type="submit"
                disabled={formState.isSubmitting || isDeleting}
                loading={formState.isSubmitting}
              >
                Submit
              </LoadingButton>
              {noteToEdit && (
                <LoadingButton
                  variant="destructive"
                  disabled={formState.isSubmitting || isDeleting}
                  loading={isDeleting}
                  onClick={deleteNote}
                  type="button"
                >
                  Delete note
                </LoadingButton>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AddEditNoteDialog;
