"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { createServiceRequest } from "@/lib/actions/service-requests";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
};

type Service = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  icon: string | null;
};

type NewRequestFormProps = {
  categories: Category[];
  services: Service[];
  initialCategoryId: string | null;
  initialServiceId: string | null;
};

const initialState = {
  error: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Submitting request..." : "Submit Request"}
    </Button>
  );
}

export default function NewRequestForm({
  categories,
  services,
  initialCategoryId,
  initialServiceId,
}: NewRequestFormProps) {
  const [state, formAction] = useActionState(
    createServiceRequest,
    initialState,
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialCategoryId ?? "",
  );

  const [selectedServiceId, setSelectedServiceId] = useState(
    initialServiceId ?? "",
  );

  const filteredServices = useMemo(() => {
    if (!selectedCategoryId) {
      return [];
    }

    return services.filter(
      (service) => service.category_id === selectedCategoryId,
    );
  }, [services, selectedCategoryId]);

  function handleCategoryChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const categoryId = event.target.value;

    setSelectedCategoryId(categoryId);

    const currentService = services.find(
      (service) =>
        service.id === selectedServiceId && service.category_id === categoryId,
    );

    setSelectedServiceId(currentService?.id ?? "");
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Service</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="category_id">
              Service category <span className="text-destructive">*</span>
            </Label>

            <select
              id="category_id"
              name="category_id"
              value={selectedCategoryId}
              onChange={handleCategoryChange}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a category</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <p className="text-xs text-muted-foreground">
              Choose the type of service you need.
            </p>
          </div>

          {selectedCategoryId && (
            <div className="space-y-2">
              <Label htmlFor="service_id">
                Specific service{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>

              <select
                id="service_id"
                name="service_id"
                value={selectedServiceId}
                onChange={(event) => setSelectedServiceId(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a specific service</option>

                {filteredServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>

              {filteredServices.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  There are no specific services available in this category yet.
                  You can still submit your request using the category.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What do you need?</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">
              Request title <span className="text-destructive">*</span>
            </Label>

            <Input
              id="title"
              name="title"
              placeholder="e.g. My air conditioner is not cooling"
              required
              minLength={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>

            <Textarea
              id="description"
              name="description"
              placeholder="Describe what you need done. Include any useful details about the problem or task."
              required
              minLength={10}
              rows={6}
            />

            <p className="text-xs text-muted-foreground">
              Give the service provider enough information to understand what
              you need.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget and schedule</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budget">Estimated budget</Label>

              <Input
                id="budget"
                name="budget"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 50000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>

              <select
                id="currency"
                name="currency"
                defaultValue="NGN"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="NGN">NGN — Nigerian Naira</option>
                <option value="USD">USD — US Dollar</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="preferred_date">Preferred date</Label>

              <Input id="preferred_date" name="preferred_date" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_time">Preferred time</Label>

              <Input id="preferred_time" name="preferred_time" type="time" />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Checkbox id="is_urgent" name="is_urgent" />

            <div className="space-y-1">
              <Label htmlFor="is_urgent" className="cursor-pointer">
                This is an urgent request
              </Label>

              <p className="text-xs text-muted-foreground">
                Mark this if you need the service as soon as possible.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service location</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>

            <Input
              id="address"
              name="address"
              placeholder="House number, street, landmark..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>

              <Input id="city" name="city" placeholder="e.g. Ibadan" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>

              <Input id="state" name="state" placeholder="e.g. Oyo" />
            </div>
          </div>

          {/*
           * These will be populated later when we add proper
           * map/location selection.
           */}
          <input type="hidden" name="latitude" />
          <input type="hidden" name="longitude" />
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline">
          <Link href="/dashboard/customer/requests">Cancel</Link>
        </Button>

        <SubmitButton />
      </div>
    </form>
  );
}
