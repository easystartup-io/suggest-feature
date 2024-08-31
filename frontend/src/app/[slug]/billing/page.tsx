"use client"
import Loading from '@/components/Loading';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { openCrisp } from '@/lib/open-crisp';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams } from 'next/navigation'
import PaymentSuccessPopup from '@/components/PaymentSuccessPopup';

const BillingPage = ({ params }) => {
  const [subscription, setSubscription] = useState(null);
  const [interval, setInterval] = useState('monthly');
  const [isPlanDetailsOpen, setIsPlanDetailsOpen] = useState(false);
  const [isPaymentSuccessOpen, setIsPaymentSuccessOpen] = useState(false);  // New state

  const { user } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const state = searchParams.get('state')

  useEffect(() => {
    if (state === 'success') {
      setIsPaymentSuccessOpen(true);  // Open the popup on success
    }
  }, [state]);

  useEffect(() => {
    fetch(`/api/auth/billing/get-subscription-details`, {
      method: "GET",
      headers: {
        "x-org-slug": params.slug,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setSubscription(data)
      })
  }, [params.slug]);

  const getAndRedirectToCheckoutLink = async (plan) => {
    try {
      const resp = await fetch(`/api/auth/billing/get-checkout-link`, {
        method: "POST",
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan })
      })

      const respData = await resp.json()
      window.location.href = respData.url
    } catch (err) {
      toast({
        title: "Error fetching checkout link",
        description: "Contact support for further queries",
        variant: "destructive"
      })
      console.log(err)
    }
  }

  const cancelSubscription = async () => {
    try {
      const resp = await fetch(`/api/auth/billing/cancel-subscription`, {
        method: "POST",
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      const respData = await resp.json()
    } catch (err) {
      console.log(err)
    }
  }

  if (!subscription) {
    return <Loading />;
  }

  if (subscription && subscription.subscriptionPlan === 'self_hosted') {
    return (<div className='flex items-center justify-center h-screen w-full text-xl'>
      Self Hosted Plan. Please contact support for further queries.
    </div>)
  }

  return (
    <ScrollArea className="h-full">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Billing</h1>
        <p className="text-muted-foreground mb-6">Manage your subscription, payment information, and invoices.</p>
        {
          subscription && subscription.trial &&
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Current plan</span>
                  <span className="font-semibold">
                    Trial
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Trial end date</span>
                  <span className="font-semibold">
                    {`Expiring in ${formatDistanceToNow(new Date(subscription.trialEndDate), { addSuffix: true })}`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        }
        {
          subscription && !subscription.trial &&
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Next billing date:</span>
                  <span className="font-semibold">Never</span>
                </div>
                <div className="flex justify-between">
                  <span>Invoices sent to:</span>
                  <span className="font-semibold">
                    tony.stark@gmail.com
                    <Button variant="link" className="ml-2 p-0 h-auto">Change</Button>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Credit Card:</span>
                  <span className="font-semibold">
                    None
                    <Button variant="link" className="ml-2 p-0 h-auto">Add</Button>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-semibold">
                    $0/mo
                    <Button variant="link" className="ml-2 p-0 h-auto">See invoice history</Button>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        }
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold">Plans</h2>

          <div className="mb-4">
            <Dialog open={isPlanDetailsOpen} onOpenChange={setIsPlanDetailsOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-indigo-700 hover:bg-indigo-700/90"
                >
                  View Plan Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] w-[800px] max-h-[95vh] h-[600px] p-0">
                <iframe
                  src="https://suggestfeature.com/#pricing"
                  className="w-full h-full border-none"
                  title="Plan Details"
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "Basic", price: "$9/mo", description: "Best option for personal use & for your next project", current: (!subscription.trial && subscription.subscriptionPlan === 'basic') },
            { name: "Pro", price: "$29/mo", description: "Relevant for multiple users & extended support", billingPeriod: "" },
            { name: "Team", price: "$49/mo", description: "Best for small to medium sized businesses", billingPeriod: "" },
            { name: "Enterprise", price: "Custom", description: "Deploy additional permissions, compliance, and customizations" }
          ].map((plan, index) => (
            <Card key={index} className={plan.current ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{plan.price}</div>
                    {plan.billingPeriod && <div className="text-sm text-muted-foreground">{plan.billingPeriod}</div>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{plan.description}</p>
                {plan.current ? (
                  <Badge variant="outline" className="bg-primary/10 text-primary">Current Plan</Badge>
                ) : (
                  <Button variant={plan.name === "Enterprise" ? "outline" : "default"}
                    onClick={() => plan.name === "Enterprise" ? openCrisp({
                      user, params, message: {
                        msg: "I would like to upgrade to the Enterprise plan"
                      }
                    }) : getAndRedirectToCheckoutLink(plan.name)}
                  >
                    {plan.name === "Enterprise" ? "Contact Us" : "Upgrade"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className='my-12' />

        <section className="flex justify-between items-center my-6">
          <h2 className="text-2xl font-bold text-red-800">Terminate Subscription</h2>
          <p className="text-sm text-red-700">
            Warning: Termination will disable user feedback and remove admin privileges.
          </p>
        </section>
        <section className="flex justify-between items-center my-4 text-red">
          <p className="text-sm underline text-red-700 cursor-pointer" onClick={() => {
            openCrisp({
              user, params, message: {
                msg: "I would like to terminate my subscription"
              }
            })
          }}>
            Click here to contact us to terminate your subscription.
          </p>
        </section>
      </div>
      <PaymentSuccessPopup
        isOpen={isPaymentSuccessOpen}
        onClose={() => setIsPaymentSuccessOpen(false)}
      />
    </ScrollArea>
  );
};

export default BillingPage;
