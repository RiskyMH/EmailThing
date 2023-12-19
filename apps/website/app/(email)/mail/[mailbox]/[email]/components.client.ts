'use client'
import { useEffect } from "react";



export function MarkRead({action}: any){
    useEffect(() => {
        action()
    }, [action])
    return null
}