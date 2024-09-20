import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCw, Copy, CheckCircle, XCircle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Icons } from "@/components/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SSOConfiguration = ({ orgSlug, initialSSOSettings, onSave }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [enableCustomSSO, setEnableCustomSSO] = useState(false);
  const [exclusiveSSO, setExclusiveSSO] = useState(false);
  const [ssoRedirectUrl, setSsoRedirectUrl] = useState('');
  const [primaryKey, setPrimaryKey] = useState('');
  const [secondaryKey, setSecondaryKey] = useState('');
  const [jwtToken, setJwtToken] = useState('');
  const [jwtVerificationResult, setJwtVerificationResult] = useState(null);
  const [jwtDecodedContents, setJwtDecodedContents] = useState(null);
  const [showJwtContents, setShowJwtContents] = useState(false);
  const [showRefreshConfirmation, setShowRefreshConfirmation] = useState(false);
  const [keyToRefresh, setKeyToRefresh] = useState(null);

  useEffect(() => {
    if (initialSSOSettings) {
      setEnableCustomSSO(initialSSOSettings.enableCustomSSO || false);
      setExclusiveSSO(initialSSOSettings.exclusiveSSO || false);
      setSsoRedirectUrl(initialSSOSettings.ssoRedirectUrl || '');
      setPrimaryKey(initialSSOSettings.primaryKey || '');
      setSecondaryKey(initialSSOSettings.secondaryKey || '');
    }
  }, [initialSSOSettings]);

  const refreshKey = async (keyType) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/pages/refresh-sso-key`, {
        method: 'POST',
        headers: {
          "x-org-slug": orgSlug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keyType })
      });
      const data = await response.json();
      if (response.ok) {
        if (keyType === 'primary') {
          setPrimaryKey(data.newKey);
        } else {
          setSecondaryKey(data.newKey);
        }
        toast({
          title: `${keyType.charAt(0).toUpperCase() + keyType.slice(1)} key refreshed successfully`,
        });
      } else {
        toast({
          title: 'Failed to refresh key',
          description: data.message,
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Something went wrong',
        description: 'Please try again. If the problem persists, contact support.',
        variant: 'destructive'
      });
    }
    setIsLoading(false);
  };

  const handleRefreshClick = (keyType) => {
    setKeyToRefresh(keyType);
    setShowRefreshConfirmation(true);
  };

  const handleConfirmRefresh = () => {
    setShowRefreshConfirmation(false);
    refreshKey(keyToRefresh);
  };

  const verifyJwtToken = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/pages/verify-jwt`, {
        method: 'POST',
        headers: {
          "x-org-slug": orgSlug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jwtToken })
      });
      const data = await response.json();
      if (response.ok) {
        setJwtVerificationResult(data.isValid);
        setJwtDecodedContents(data.decodedToken || null);
        setShowJwtContents(true);
      } else {
        setJwtVerificationResult(false);
        setJwtDecodedContents(null);
        toast({
          title: 'Failed to verify JWT token',
          description: data.message,
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error(err);
      setJwtVerificationResult(false);
      setJwtDecodedContents(null);
      toast({
        title: 'Error verifying JWT token',
        description: 'Please try again. If the problem persists, contact support.',
        variant: 'destructive'
      });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const ssoSettings = {
      enableCustomSSO,
      exclusiveSSO,
      ssoRedirectUrl,
      primaryKey,
      secondaryKey
    };
    try {
      const response = await fetch(`/api/auth/pages/update-sso-settings`, {
        method: 'POST',
        headers: {
          "x-org-slug": orgSlug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ssoSettings)
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: 'SSO Configuration saved successfully',
        });
        onSave(ssoSettings);
      } else {
        toast({
          title: 'Failed to save SSO Configuration',
          description: data.message,
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Something went wrong',
        description: 'Please try again. If the problem persists, contact support.',
        variant: 'destructive'
      });
    }
    setIsSaving(false);
  };

  const copyToClipboard = (text, keyType) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: `${keyType} key copied to clipboard`,
        duration: 2000,
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({
        title: 'Failed to copy key',
        description: 'Please try again',
        variant: 'destructive',
      });
    });
  };

  const renderJwtContents = () => {
    if (!jwtDecodedContents) return null;

    return (
      <div className="mt-4 bg-gray-50 rounded-md overflow-hidden">
        <div
          className="flex items-center justify-between p-4 bg-gray-100 cursor-pointer"
          onClick={() => setShowJwtContents(!showJwtContents)}
        >
          <h3 className="text-md font-semibold">Decoded JWT Contents</h3>
          {showJwtContents ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
        {showJwtContents && (
          <div className="p-4">
            {Object.entries(jwtDecodedContents).map(([key, value]) => (
              <div key={key} className="mb-2">
                <span className="font-semibold">{key}: </span>
                <span className="text-gray-700">{JSON.stringify(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6 border border-dashed rounded-lg">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Custom JWT-based SSO Configuration</h2>
        <a
          href="https://docs.suggestfeature.com/suggest-feature/advanced/sso-auth"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
        >
          <span className="mr-1 text-sm">Documentation</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="enable-custom-sso"
          checked={enableCustomSSO}
          onCheckedChange={setEnableCustomSSO}
        />
        <Label htmlFor="enable-custom-sso">Enable Custom SSO</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="exclusive-sso"
          checked={exclusiveSSO}
          onCheckedChange={setExclusiveSSO}
          disabled={!enableCustomSSO}
        />
        <Label htmlFor="exclusive-sso">Use SSO Exclusively (Disable All Other Login Methods)</Label>
      </div>

      <div>
        <Label htmlFor="sso-redirect-url">SSO Redirect URL</Label>
        <Input
          id="sso-redirect-url"
          disabled={!enableCustomSSO || isLoading}
          placeholder="https://yourwebsite.com/sso/login"
          value={ssoRedirectUrl}
          onChange={(e) => setSsoRedirectUrl(e.target.value)}
        />
        <p className="text-sm text-gray-500 mt-1">
          We will append state and redirectUrl parameters to this URL for SSO redirection.
        </p>
      </div>

      <div>
        <Label htmlFor="primary-key">Primary Key</Label>
        <div className="flex items-center space-x-2">
          <div className="relative flex-grow">
            <Input
              id="primary-key"
              readOnly
              value={primaryKey}
              onClick={() => copyToClipboard(primaryKey, 'Primary')}
              className="pr-10 cursor-pointer"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full"
              onClick={() => copyToClipboard(primaryKey, 'Primary')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            onClick={() => handleRefreshClick('primary')}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="secondary-key">Secondary Key (Backup)</Label>
        <div className="flex items-center space-x-2">
          <div className="relative flex-grow">
            <Input
              id="secondary-key"
              readOnly
              value={secondaryKey}
              onClick={() => copyToClipboard(secondaryKey, 'Secondary')}
              className="pr-10 cursor-pointer"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full"
              onClick={() => copyToClipboard(secondaryKey, 'Secondary')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            onClick={() => handleRefreshClick('secondary')}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="jwt-verification">JWT Token Verification</Label>
        <Textarea
          id="jwt-verification"
          placeholder="Enter JWT token for verification"
          value={jwtToken}
          onChange={(e) => setJwtToken(e.target.value)}
        />
        <div className="flex items-center space-x-2 mt-2">
          <Button type="button" onClick={verifyJwtToken} disabled={!jwtToken || isLoading}>
            {isLoading ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
            Verify Token
          </Button>
          {jwtVerificationResult !== null && (
            <div className={`flex items-center ${jwtVerificationResult ? 'text-green-500' : 'text-red-500'}`}>
              {jwtVerificationResult ? (
                <CheckCircle className="h-5 w-5 mr-1" />
              ) : (
                <XCircle className="h-5 w-5 mr-1" />
              )}
              <span>{jwtVerificationResult ? 'Valid JWT token' : 'Invalid JWT token'}</span>
            </div>
          )}
        </div>
        {renderJwtContents()}
      </div>

      <Button onClick={handleSave} disabled={isLoading || isSaving}>
        {isSaving ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save SSO Configuration'
        )}
      </Button>

      <AlertDialog open={showRefreshConfirmation} onOpenChange={setShowRefreshConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Key Refresh</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to refresh the {keyToRefresh} key? This action will replace the existing key, and any systems using the current key will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRefresh}>Refresh Key</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SSOConfiguration;
