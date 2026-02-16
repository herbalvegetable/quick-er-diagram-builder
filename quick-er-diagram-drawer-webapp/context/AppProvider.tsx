import CameraPositionProvider from "./CameraPositionProvider";

export default function AppProvider(props: any){
    return (
        <CameraPositionProvider>
            {props.children}
        </CameraPositionProvider>
    )
}