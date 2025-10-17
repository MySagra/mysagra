interface ErrorHandlerProps {
    error: Error
}

// TODO: Error handler
export function ErrorHandler({ error }: ErrorHandlerProps) {
    console.error(error);

    return (
        <div>
            {"Error"}
        </div>
    )
}