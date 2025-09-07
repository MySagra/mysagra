"use client"

import { Trash, Upload } from "lucide-react"
import { Input } from "./input"
import { useRef, useState, forwardRef, useImperativeHandle } from "react"
import Image from "next/image"
import { Button } from "./button"
import { Category } from "@/types/category"
import { useTranslations } from "next-intl"

interface UploadImageProps {
    initialPreview?: string
    category?: Category
    onChange?: (file: File | undefined) => void
}

export interface UploadImageRef {
    getFile: () => File | undefined
    getPreview: () => string
    reset: () => void
}

export const UploadImage = forwardRef<UploadImageRef, UploadImageProps>(
    (
        { initialPreview = "", category, onChange }, ref
    ) => {
        const t = useTranslations('Category.formFields.image')
        const fileInputRef = useRef<HTMLInputElement>(null)
        const [file, setFile] = useState<File | undefined>(undefined);
        const [preview, setPreview] = useState<string>(initialPreview);
        const [isDragOver, setIsDragOver] = useState(false);

        const handleBrowseClick = () => {
            fileInputRef.current?.click()
        }

        const processFile = (selectedFile: File) => {
            setFile(selectedFile)
            onChange?.(selectedFile) // Notifica il parent component

            const reader = new FileReader()
            reader.onload = (e) => {
                setPreview(e.target?.result as string)
            }
            reader.readAsDataURL(selectedFile)
        }

        const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFile = event.target.files?.[0]
            if (selectedFile) {
                processFile(selectedFile)
            }
        }

        const handleRemoveFile = () => {
            setFile(undefined)
            setPreview("")
            onChange?.(undefined) // Notifica che il file è stato rimosso
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }

        // Drag and Drop handlers
        const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOver(true)
        }

        const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOver(false)
        }

        const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOver(false)

            const droppedFiles = Array.from(e.dataTransfer.files)
            const imageFile = droppedFiles.find(file => file.type.startsWith('image/'))
            
            if (imageFile) {
                processFile(imageFile)
            }
        }

        useImperativeHandle(ref, () => ({
            getFile: () => file,
            getPreview: () => preview,
            reset: () => {
                setFile(undefined)
                setPreview("")
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            }
        }))

        return (
            <div className="space-y-3">
                {
                    preview ?
                        <DisplayImage preview={preview} fileName={file?.name || category?.image || ""} size={file?.size} onRemove={handleRemoveFile} />
                        :
                        <div 
                            className={`h-44 border-2 rounded-md flex flex-col items-center place-content-center border-dashed transition-all duration-300 cursor-pointer
                                ${isDragOver 
                                    ? 'border-primary bg-primary/10' 
                                    : 'hover:border-primary/50 hover:bg-primary/5'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={handleBrowseClick}
                        >
                            <Input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <div className="flex flex-col gap-2 items-center pointer-events-none">
                                <Upload className={`text-primary size-14 transition-all duration-300 
                                    ${isDragOver ? 'scale-125 text-primary/80' : 'hover:scale-110'}`} />
                                <div className="flex flex-col gap-0.5 items-center">
                                    <h3 className="text-sm font-semibold">
                                        {isDragOver 
                                            ? t('drop')
                                            : <p>
                                                {
                                                    t.rich('placeholder',{
                                                        highlight: (chunk) => <span className="text-primary hover:underline transition-colors duration-200">{chunk}</span>
                                                    })
                                                }
                                            </p>
                                        }
                                    </h3>
                                    <p className="text-gray-300 text-xs">{`${t('supports')}: JPG, JPEG, PNG`}</p>
                                </div>
                            </div>
                        </div>
                }
            </div>
        )
    })

UploadImage.displayName = "UploadImage"

interface DisplayImageProp {
    fileName: string,
    size?: number
    preview: string,
    onRemove: () => void
}

function DisplayImage({ fileName, size, preview, onRemove }: DisplayImageProp) {
    return (
        <div className="h-20 flex gap-6 bg-primary/20 p-3 rounded-xs items-center place-content-between 
                       animate-in slide-in-from-top-3 fade-in duration-500">
            <div className="flex flex-row gap-4 h-full">
                <div className="relative w-[100px] overflow-hidden bg-gray-200">
                    <Image
                        src={preview}
                        alt="preview"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
                <div className="flex flex-col gap-0.5">
                    <h4 className="text-sm font-semibold">{fileName}</h4>
                    {
                        size ?
                            <p className="text-xs text-gray-600">
                                {`${(size / (1024 * 1000)).toFixed(2)} mb`}
                            </p>
                            :
                            <></>
                    }
                </div>
            </div>
            <Button
                size={"icon"}
                variant={"outline"}
                onClick={onRemove}
            >
                <Trash />
            </Button>
        </div>
    );
}