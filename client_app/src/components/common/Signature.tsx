import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import SignatureCanvas, { SignatureViewRef } from 'react-native-signature-canvas';

export interface SignatureComponentRef {
  getSignature: () => string | null;
  clear: () => void;
  hasSignature: () => boolean;
  readSignature: () => void;
  onSignatureReady?: (signature: string) => void;
}

interface SignatureComponentProps {
  onSignatureReady?: (signature: string) => void;
}

const SignatureComponent = forwardRef<SignatureComponentRef, SignatureComponentProps>((props, ref) => {
  SignatureComponent.displayName = 'SignatureComponent';
  const { onSignatureReady } = props;
  const canvasRef = useRef<SignatureViewRef | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [hasSignature, setHasSignature] = useState(false);

  useImperativeHandle(ref, () => ({
    getSignature: () => signature,
    clear: () => {
      canvasRef.current?.clearSignature();
      setSignature(null);
      setHasSignature(false);
    },
    hasSignature: () => hasSignature || (signature !== null && signature.length > 0),
    readSignature: () => {
      // Gọi readSignature và đợi onOK callback
      canvasRef.current?.readSignature();
    }
  }));

  const handleSignature = (signature: string) => {
    console.log('📝 [Signature] handleSignature called, signature length:', signature?.length || 0);
    if (signature && signature.length > 0) {
      setSignature(signature);
      setHasSignature(true);
      console.log('✅ [Signature] Signature saved to state');
      // KHÔNG gọi callback ở đây vì onOK được gọi khi readSignature(), 
      // không phải khi người dùng vẽ
    } else {
      console.log('⚠️ [Signature] Empty signature received');
      setHasSignature(false);
    }
  };

  const handleEmpty = () => {
    setHasSignature(false);
  };

  const handleClear = () => {
    setSignature(null);
    setHasSignature(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.signatureBox}>
        <SignatureCanvas
          ref={canvasRef}
          onOK={handleSignature}
          onEmpty={handleEmpty}
          onClear={handleClear}
          autoClear={false}
          descriptionText=" "
          clearText=""
          confirmText=""
          penColor="#000000"
          backgroundColor="rgba(255,255,255,1)"
          webviewProps={{
            cacheEnabled: true,
            androidLayerType: "hardware",
            injectedJavaScript: `
              (function() {
                var buttons = document.querySelectorAll('button, .btn, .button');
                for(var i = 0; i < buttons.length; i++) {
                  buttons[i].style.display = 'none';
                }
                true;
              })();
            `
          }}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
  },
  signatureBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
});

export default SignatureComponent;