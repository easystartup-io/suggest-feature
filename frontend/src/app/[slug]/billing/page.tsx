"use client"
import React, { useEffect, useState } from 'react';
import Loading from '@/components/Loading';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, formatDistanceToNow, isPast } from 'date-fns';
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
import { Icons } from '@/components/icons';
import { CreditCard, Pencil } from 'lucide-react';

const BillingPage = ({ params }) => {
  const [subscription, setSubscription] = useState(null);
  const [isPlanDetailsOpen, setIsPlanDetailsOpen] = useState(false);
  const [isPaymentSuccessOpen, setIsPaymentSuccessOpen] = useState(false);
  const [loadingButtonData, setLoadingButtonData] = useState(false);
  const [loadingPaymentUpdate, setLoadingPaymentUpdate] = useState(false);

  const { user } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const status = searchParams.get('status')

  useEffect(() => {
    if (status === 'success') {
      setIsPaymentSuccessOpen(true);
    }
  }, [status]);

  function refetchSubscriptionDetails() {
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
  }

  useEffect(() => {
    refetchSubscriptionDetails()
  }, [params.slug]);

  const getAndRedirectToCheckoutLink = async (plan) => {
    try {
      setLoadingButtonData(true)
      const resp = await fetch(`/api/auth/billing/get-checkout-link`, {
        method: "POST",
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan, currentUrl: window.location.href })
      })

      const respData = await resp.json()
      console.log(resp)
      if (resp.status !== 200) {
        throw new Error(respData.message)
      };
      window.location.href = respData.url
    } catch (err) {
      toast({
        title: err.message || "Error fetching checkout link",
        description: "Contact support for further queries",
        variant: "destructive"
      })
      console.log(err)
    }
    setTimeout(() => {
      setLoadingButtonData(false)
    }, 1000)
  }

  const upgradePlan = async (newPlan) => {
    try {
      setLoadingButtonData(true)
      const resp = await fetch(`/api/auth/billing/upgrade-subscription`, {
        method: "POST",
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: newPlan })
      })

      const respData = await resp.json()
      if (resp.status !== 200) {
        throw new Error(respData.message)
      };

      setSubscription(respData)

      setTimeout(() => {
        refetchSubscriptionDetails()
      }, 10000)

      toast({
        title: "Plan upgraded successfully",
        description: `Your subscription has been upgraded to ${newPlan}`,
      })
    } catch (err) {
      toast({
        title: err.message || "Error upgrading plan",
        description: "Contact support for further queries",
        variant: "destructive"
      })
      console.log(err)
    }

    setTimeout(() => {
      setLoadingButtonData(false)
    }, 1000)
  }

  const getAndRedirectToUpdatePaymentLink = async () => {
    try {
      setLoadingPaymentUpdate(true)
      const resp = await fetch(`/api/auth/billing/update-payment-details`, {
        method: "POST",
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentUrl: window.location.href })
      })

      const respData = await resp.json()
      if (resp.status !== 200) {
        throw new Error(respData.message)
      };
      window.open(respData.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast({
        title: err.message || "Error fetching update payment link",
        description: "Contact support for further queries",
        variant: "destructive"
      })
      console.log(err)
    } finally {
      setLoadingPaymentUpdate(false)
    }
  }

  if (!subscription) {
    return <Loading />;
  }

  if (subscription && subscription.subscriptionPlan === 'self_hosted') {
    return (
      <div className='flex items-center justify-center h-screen w-full text-xl'>
        Self Hosted Plan. Please contact support for further queries.
      </div>
    )
  }

  const planOrder = ['basic', 'pro', 'team', 'enterprise'];
  const currentPlanIndex = planOrder.indexOf(subscription.subscriptionPlan);

  const plans = [
    { name: "Basic", price: "$9/mo", description: "Best option for personal use & for your next project", planKey: 'basic' },
    { name: "Pro", price: "$29/mo", description: "Relevant for multiple users & extended support", planKey: 'pro' },
    { name: "Team", price: "$49/mo", description: "Best for small to medium sized businesses", planKey: 'team' },
    { name: "Enterprise", price: "Custom", description: "Deploy additional permissions, compliance, and customizations", planKey: 'enterprise' },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Billing</h1>
        <p className="text-muted-foreground mb-6">Manage your subscription, payment information, and invoices.</p>
        {
          subscription && subscription.trial &&
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                Subscription
                <div className="mt-2">
                  <Badge variant={isPast(new Date(subscription.trialEndDate)) ? "destructive" : "secondary"}>
                    {isPast(new Date(subscription.trialEndDate)) ? 'Expired' : 'Active'}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Current plan</span>
                  <span className="font-semibold">
                    Trial
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Trial end date</span>
                  <span className="font-semibold text-sm">
                    {isPast(new Date(subscription.trialEndDate))
                      ? `Expired ${formatDistanceToNow(new Date(subscription.trialEndDate), { addSuffix: true })}`
                      : `Expiring ${formatDistanceToNow(new Date(subscription.trialEndDate), { addSuffix: true })}`
                    }
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
              <CardTitle>
                <div className='flex items-center justify-between'>
                  <div>
                    Subscription
                  </div>
                  <div>
                    <Button
                      onClick={getAndRedirectToUpdatePaymentLink}
                      disabled={loadingPaymentUpdate}
                      variant="outline"
                    >
                      {loadingPaymentUpdate ? (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Pencil className="mr-2 h-4 w-4" />
                      )}
                      Edit
                    </Button>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Next billing date</span>
                  <span className="font-semibold">{format(subscription.nextBillingDate, 'd MMMM yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Invoices sent to</span>
                  <span className="font-semibold">
                    {subscription.email}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Credit Card</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">
                      {subscription.cardBrand.charAt(0).toUpperCase() + subscription.cardBrand.slice(1)} ending in {subscription.cardLastFour}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Plan</span>
                  <span className="font-semibold">
                    {subscription.subscriptionPlan.charAt(0).toUpperCase() + subscription.subscriptionPlan.slice(1)}
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
          {plans.map((plan, index) => {
            const planIndex = planOrder.indexOf(plan.planKey);
            const isCurrent = !subscription.trial && subscription.subscriptionPlan === plan.planKey;
            const isDisabled = planIndex <= currentPlanIndex && !subscription.trial;

            return (
              <Card key={index} className={isCurrent ? "border-2 border-primary" : ""}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{plan.price}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{plan.description}</p>
                  {isCurrent ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary">Current Plan</Badge>
                  ) : (
                    <Button
                      variant={plan.name === "Enterprise" ? "outline" : "default"}
                      onClick={() => {
                        if (plan.name === "Enterprise") {
                          openCrisp({
                            user, params, message: {
                              msg: "I would like to upgrade to the Enterprise plan"
                            }
                          })
                        } else if (subscription.trial) {
                          getAndRedirectToCheckoutLink(plan.name)
                        } else {
                          upgradePlan(plan.planKey)
                        }
                      }}
                      disabled={isDisabled || loadingButtonData}
                    >
                      {loadingButtonData && (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {plan.name === "Enterprise" ? "Contact Us" : isDisabled ? "Not Available" : "Upgrade"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
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
