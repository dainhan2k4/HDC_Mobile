import { WebView } from 'react-native-webview';

const ContractPDF = (pdfUri: string) => {
    return (
        <WebView
        originWhitelist={['*']}
        source={{ uri: pdfUri }}
        style={{ flex: 1 }}
      />
    );
};

export default ContractPDF;
