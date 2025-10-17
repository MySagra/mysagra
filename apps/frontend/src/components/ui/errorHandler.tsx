interface ErrorHandlerProps {
    error: Error
}


export function ErrorHandler({ error }: ErrorHandlerProps) {
    console.error(error);

    return (
        <div>
            Error
        </div>
    )
}