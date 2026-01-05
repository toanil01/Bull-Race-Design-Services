import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Image as ImageIcon, Loader2, Trash2, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Photo } from "@shared/schema";

const photoFormSchema = z.object({
    caption: z.string().optional(),
    category: z.string().min(1, "Category is required"),
});

type PhotoFormData = z.infer<typeof photoFormSchema>;

export default function GalleryPage() {
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const { data: photos = [], isLoading } = useQuery<Photo[]>({
        queryKey: ["/api/photos"],
    });

    const form = useForm<PhotoFormData>({
        resolver: zodResolver(photoFormSchema),
        defaultValues: {
            caption: "",
            category: "race",
        },
    });

    const uploadMutation = useMutation({
        mutationFn: async (data: PhotoFormData & { url: string }) => {
            return apiRequest("POST", "/api/photos", data);
        },
        onSuccess: () => {
            toast({ title: "Photo Uploaded", description: "Successfully added to gallery" });
            queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
            setIsDialogOpen(false);
            form.reset();
            setSelectedFile(null);
            setIsUploading(false);
        },
        onError: (error) => {
            toast({
                title: "Upload Failed",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "destructive"
            });
            setIsUploading(false);
        },
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            console.log("File input changed. Selected file:", file.name, file.size);
            if (file.size > 5 * 1024 * 1024) {
                toast({ title: "File too large", description: "Max 5MB allowed", variant: "destructive" });
                return;
            }
            setSelectedFile(file);
        }
    };

    const onSubmit = async (data: PhotoFormData) => {
        if (!selectedFile) {
            toast({ title: "No File", description: "Please select an image", variant: "destructive" });
            return;
        }

        try {
            setIsUploading(true);
            console.log("Starting Firebase upload for:", selectedFile.name);

            // Create a reference to the file in Firebase Storage
            const storageRef = ref(storage, `photos/${Date.now()}_${selectedFile.name}`);
            console.log("Storage Ref created:", storageRef.fullPath);

            // Upload the file
            const snapshot = await uploadBytes(storageRef, selectedFile);
            console.log("Upload snapshot received:", snapshot);

            // Get the public URL
            const url = await getDownloadURL(snapshot.ref);
            console.log("Download URL generated:", url);

            // Save metadata to our API
            console.log("Sending photo metadata to backend...", { ...data, url });
            uploadMutation.mutate({ ...data, url });
        } catch (error) {
            console.error("Firebase Upload Error:", error);
            toast({
                title: "Upload Failed",
                description: "Failed to upload to Firebase Storage. Check Console for CORS/Permissions errors.",
                variant: "destructive"
            });
            setIsUploading(false);
        }
    };

    return (
        <div className="flex h-screen bg-background">
            <AdminSidebar />
            <main className="flex-1 overflow-auto p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Photo Gallery</h1>
                        <p className="text-muted-foreground">Manage gallery images and categories</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Photo
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Upload Photo</DialogTitle>
                            </DialogHeader>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.error("Form Validation Errors:", errors))} className="space-y-4">
                                    <FormItem>
                                        <FormLabel>Image File</FormLabel>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            disabled={isUploading}
                                        />
                                        {selectedFile && (
                                            <p className="text-xs text-muted-foreground">
                                                Selected: {selectedFile.name}
                                            </p>
                                        )}
                                    </FormItem>

                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="race">Race Action</SelectItem>
                                                        <SelectItem value="winners">Winners</SelectItem>
                                                        <SelectItem value="atmosphere">Atmosphere</SelectItem>
                                                        <SelectItem value="bulls">Bulls</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="caption"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Caption (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="e.g. Winner of Junior Category" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit" className="w-full" disabled={isUploading}>
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            "Upload Photo"
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : photos.length === 0 ? (
                    <div className="text-center p-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No photos uploaded yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {photos.map((photo) => (
                            <div key={photo.id} className="group relative aspect-video bg-muted rounded-lg overflow-hidden border">
                                <img
                                    src={photo.url}
                                    alt={photo.caption || "Gallery image"}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                    <p className="text-white font-medium truncate">{photo.caption || "No caption"}</p>
                                    <p className="text-white/80 text-xs capitalize">{photo.category}</p>

                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-8 w-8"
                                            title="Delete (Not implemented)"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <a href={photo.url} target="_blank" rel="noopener noreferrer">
                                            <Button variant="secondary" size="icon" className="h-8 w-8">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
