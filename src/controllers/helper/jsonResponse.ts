export const successJson = (message: string | null, data: any) => {
    return {
        sueess: true,
        message: message,
        data: data
    }
}

export const errorJson = (message: string | null, data: any) => {
    return {
        sueess: false,
        message: message,
        data: data
    }
}


