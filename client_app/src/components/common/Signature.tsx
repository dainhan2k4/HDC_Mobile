import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import SignatureCanvas, { SignatureViewRef } from 'react-native-signature-canvas';

export interface SignatureComponentRef {
  getSignature: () => string | null;
  clear: () => void;
  hasSignature: () => boolean;
  readSignature: () => void;
}

const SignatureComponent = forwardRef<SignatureComponentRef>((props, ref) => {
  SignatureComponent.displayName = 'SignatureComponent';
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
    hasSignature: () => hasSignature,
    readSignature: () => {
      canvasRef.current?.readSignature();
    }
  }));

  const handleSignature = (signature: string) => {
    setSignature(signature);
    setHasSignature(true);
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
      {/* Signature Area */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureContainer}>
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
        
        {/* Status Indicator */}
        <View style={styles.statusContainer}>
          {hasSignature ? (
            <View style={styles.statusSuccess}>
              <Text style={styles.statusText}>✓ Đã ký thành công</Text>
            </View>
          ) : (
            <View style={styles.statusEmpty}>
              <Text style={styles.statusText}>Chưa ký</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  signatureSection: {
    flex: 1,
    padding: 20,
  },
  signatureContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 20,
  },
  signatureBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    overflow: 'hidden',
    margin: 8,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusSuccess: {
    backgroundColor: '#d4edda',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  statusEmpty: {
    backgroundColor: '#f8d7da',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#155724',
  },
});

export default SignatureComponent;