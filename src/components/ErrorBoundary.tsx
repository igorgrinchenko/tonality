import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button, Container, Typography } from "@mui/material";
import { darkTheme, lightTheme } from "../styles/colors";

interface ErrorBoundaryProps {
    children: ReactNode;
    errorBoundary: string;
    errorMessage: string;
    buttonText: string;
    theme: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        console.log(error);
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.log({ error, errorInfo });
    }

    reload() {
        window.location.reload();
    }

    render() {
        if (this.state.hasError) {
            return (
                <Container
                    maxWidth="sm"
                    className={this.props.errorBoundary}
                    sx={this.props.theme === "dark" ? { color: lightTheme, backgroundColor: darkTheme } : { color: darkTheme, backgroundColor: lightTheme }}
                >
                    <Typography variant="h6" textAlign="center">
                        {this.props.errorMessage}
                    </Typography>
                    <br />
                    <Button onClick={this.reload} variant="contained">
                        {this.props.buttonText}
                    </Button>
                </Container>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
