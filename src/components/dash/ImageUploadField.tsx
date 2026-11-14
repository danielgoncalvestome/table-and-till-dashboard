import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/**
 * Wide upload area that is replaced by the image once uploaded.
 * Hovering the image shows an "X" overlay to remove it.
 */
export function ImageUploadField({ value, onFile, onRemove, accept = "image/*", multiple = false, disabled = false, contain = false, hint }: {
  value?: string;
  onFile: (files: FileList | null) => void;
  onRemove?: () => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  /** true = object-contain (logos), false = object-cover (photos) */
  contain?: boolean;
  hint?: string;
}) {
  const { lang } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const pick = (files: FileList | null) => {
    if (!files?.length) return;
    onFile(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (value) {
    return (
      <div className="group relative w-full overflow-hidden rounded-md border">
        <img src={value} alt="" className={`h-32 w-full ${contain ? "bg-muted/40 object-contain p-2" : "object-cover"}`} />
        {onRemove && (
          <button
            type="button"
            aria-label={lang === "pt" ? "Remover imagem" : "Remove image"}
            onClick={onRemove}
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 focus:opacity-100 group-hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-x-0 bottom-0 bg-black/50 py-1 text-center text-[11px] text-white opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
        >
          {lang === "pt" ? "Substituir imagem" : "Replace image"}
        </button>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} disabled={disabled} className="hidden" onChange={(e) => pick(e.target.files)} />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files); }}
        className={`flex h-32 w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50 ${drag ? "border-primary bg-secondary" : "border-input"}`}
      >
        <ImagePlus className="h-6 w-6" />
        <span className="text-sm font-medium">{lang === "pt" ? "Carregar imagem" : "Upload image"}</span>
        <span className="px-3 text-center text-xs">{hint ?? (lang === "pt" ? "Clica ou arrasta a imagem para aqui" : "Click or drag the image here")}</span>
      </button>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} disabled={disabled} className="hidden" onChange={(e) => pick(e.target.files)} />
    </>
  );
}
