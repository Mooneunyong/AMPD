'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, DollarSign, CreditCard } from 'lucide-react';
import { DASHBOARD_STATS, RECENT_SALES } from '@/constants';
import { StatCard } from '@/components/common';

export default function Home() {
  return (
    <>
      {/* Dashboard Statistics */}
      <div className='grid auto-rows-min gap-4 md:grid-cols-3'>
        <StatCard
          title='Total Revenue'
          value={DASHBOARD_STATS.revenue.value}
          change={DASHBOARD_STATS.revenue.change}
          trend={DASHBOARD_STATS.revenue.trend}
          icon={<DollarSign className='h-4 w-4 text-muted-foreground' />}
        />
        <StatCard
          title='Subscriptions'
          value={DASHBOARD_STATS.subscriptions.value}
          change={DASHBOARD_STATS.subscriptions.change}
          trend={DASHBOARD_STATS.subscriptions.trend}
          icon={<Users className='h-4 w-4 text-muted-foreground' />}
        />
        <StatCard
          title='Sales'
          value={DASHBOARD_STATS.sales.value}
          change={DASHBOARD_STATS.sales.change}
          trend={DASHBOARD_STATS.sales.trend}
          icon={<CreditCard className='h-4 w-4 text-muted-foreground' />}
        />
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <Card className='col-span-4'>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className='pl-2'>
            <div className='h-[200px] flex items-center justify-center text-muted-foreground'>
              <BarChart3 className='h-8 w-8' />
              <span className='ml-2'>Chart placeholder</span>
            </div>
          </CardContent>
        </Card>

        <Card className='col-span-3'>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-8'>
              {RECENT_SALES.map((sale, index) => (
                <div key={index} className='flex items-center'>
                  <div className='space-y-1'>
                    <p className='text-sm font-medium leading-none'>
                      {sale.name}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {sale.email}
                    </p>
                  </div>
                  <div className='ml-auto font-medium'>{sale.amount}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
