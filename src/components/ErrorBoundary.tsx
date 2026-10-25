import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@mui/material";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

interface ErrorBoundaryProps {
    children: ReactNode;
    errorMessage: string;
    buttonText: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <main className="error-screen">
                    <section className="surface-card error-card">
                        <span className="icon-tile">
                            <ErrorOutlineRoundedIcon />
                        </span>
                        <h1>{this.props.errorMessage}</h1>
                        <Button variant="contained" onClick={() => window.location.reload()}>
                            {this.props.buttonText}
                        </Button>
                    </section>
                </main>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
