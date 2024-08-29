"use client"
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Loading from '@/components/Loading';

const BillingPage = ({ params }) => {
  const [subscription, setSubscription] = useState(null);

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

  if (!subscription) {
    return <Loading />;
  }

  if (subscription && subscription.subscriptionPlan === 'self-hosted') {
    return (<div className='flex items-center justify-center h-screen w-full text-xl'>
      Self Hosted Plan. Please contact support for further queries.
    </div>)
  }

  return (
    <ScrollArea className="h-full">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Billing</h1>
        <p className="text-muted-foreground mb-6">Manage your subscription, payment information, and invoices.</p>

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

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Plans</h2>
          <div>
            <Button variant="outline" className="mr-2">Pay Monthly</Button>
            <Button>Pay Yearly</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "Basic", price: "$9/mo", description: "Set up your feedback portal with just the basics", current: true },
            { name: "Pro", price: "$29/mo", description: "Get more out of your feedback with advanced tools", billingPeriod: "billed yearly" },
            { name: "Team", price: "$49/mo", description: "Scale insights across your team with integrations and automations", billingPeriod: "billed yearly" },
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
                  <Button variant={plan.name === "Business" ? "outline" : "default"}
                    onClick={() => plan.name === "Business" ? window.location.href = "mailto:billing@suggestfeature.com" : window.location.href = "/[slug]/billing/checkout"}
                  >
                    {plan.name === "Business" ? "Contact Us" : "Start Trial"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
};

export default BillingPage;
