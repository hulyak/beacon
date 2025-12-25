import { Request, Response } from 'express';

// ROI Calculation Service
// Requirement 5.1: Calculate ROI percentages with payback periods for each strategy option
// Requirement 5.4: Include both direct savings and avoided costs in ROI calculations

interface ROICalculationRequest {
  strategy: {
    id: string;
    name: string;
    initialInvestment: number;
    implementationCost: number;
    timeframe: number; // months
  };
  benefits: {
    directSavings: {
      costReduction: number;
      efficiencyGains: number;
      laborSavings: number;
    };
    avoidedCosts: {
      riskMitigation: number;
      complianceCosts: number;
      opportunityCosts: number;
    };
    revenueImpact: {
      increasedSales: number;
      customerRetention: number;
      marketExpansion: number;
    };
  };
  risks: {
    implementationRisk: number; // 0-1
    marketRisk: number; // 0-1
    technicalRisk: number; // 0-1
  };
}

interface ROICalculationResponse {
  strategy: {
    id: string;
    name: string;
  };
  financial: {
    totalInvestment: number;
    totalBenefits: number;
    netPresentValue: number;
    roi: number; // percentage
    paybackPeriod: number; // months
    breakEvenPoint: number; // months
  };
  breakdown: {
    directSavings: number;
    avoidedCosts: number;
    revenueImpact: number;
    riskAdjustment: number;
  };
  timeline: {
    month: number;
    cumulativeCashFlow: number;
    monthlyBenefit: number;
  }[];
  confidence: {
    score: number; // 0-100
    factors: string[];
  };
  recommendation: {
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
    nextSteps: string[];
  };
}

export const calculateROI = async (req: Request, res: Response): Promise<void> => {
  try {
    const request: ROICalculationRequest = req.body;

    // Validate input
    if (!request.strategy || !request.benefits) {
      res.status(400).json({
        error: 'Missing required fields: strategy and benefits'
      });
      return;
    }

    // Calculate total investment
    const totalInvestment = request.strategy.initialInvestment + request.strategy.implementationCost;

    // Calculate total benefits
    const directSavings = Object.values(request.benefits.directSavings).reduce((sum, val) => sum + val, 0);
    const avoidedCosts = Object.values(request.benefits.avoidedCosts).reduce((sum, val) => sum + val, 0);
    const revenueImpact = Object.values(request.benefits.revenueImpact).reduce((sum, val) => sum + val, 0);
    
    const totalBenefits = directSavings + avoidedCosts + revenueImpact;

    // Calculate risk adjustment factor
    const avgRisk = (request.risks.implementationRisk + request.risks.marketRisk + request.risks.technicalRisk) / 3;
    const riskAdjustment = totalBenefits * avgRisk * 0.2; // 20% penalty for high risk

    const adjustedBenefits = totalBenefits - riskAdjustment;

    // Calculate ROI
    const roi = ((adjustedBenefits - totalInvestment) / totalInvestment) * 100;

    // Calculate payback period
    const monthlyBenefit = adjustedBenefits / request.strategy.timeframe;
    const paybackPeriod = totalInvestment / monthlyBenefit;

    // Calculate NPV (assuming 8% discount rate)
    const discountRate = 0.08 / 12; // monthly rate
    let npv = -totalInvestment;
    
    for (let month = 1; month <= request.strategy.timeframe; month++) {
      const discountedBenefit = monthlyBenefit / Math.pow(1 + discountRate, month);
      npv += discountedBenefit;
    }

    // Generate timeline
    const timeline = [];
    let cumulativeCashFlow = -totalInvestment;
    
    for (let month = 1; month <= request.strategy.timeframe; month++) {
      cumulativeCashFlow += monthlyBenefit;
      timeline.push({
        month,
        cumulativeCashFlow: Math.round(cumulativeCashFlow),
        monthlyBenefit: Math.round(monthlyBenefit)
      });
    }

    // Calculate confidence score
    const confidenceFactors = [];
    let confidenceScore = 100;

    if (avgRisk > 0.7) {
      confidenceScore -= 30;
      confidenceFactors.push('High implementation risk detected');
    } else if (avgRisk > 0.4) {
      confidenceScore -= 15;
      confidenceFactors.push('Moderate risk factors present');
    }

    if (paybackPeriod > 24) {
      confidenceScore -= 20;
      confidenceFactors.push('Extended payback period');
    }

    if (roi < 15) {
      confidenceScore -= 25;
      confidenceFactors.push('Below target ROI threshold');
    }

    if (totalInvestment > 1000000) {
      confidenceScore -= 10;
      confidenceFactors.push('High capital requirement');
    }

    // Generate recommendation
    let priority: 'high' | 'medium' | 'low' = 'low';
    let reasoning = '';
    const nextSteps = [];

    if (roi > 25 && paybackPeriod < 18) {
      priority = 'high';
      reasoning = 'Excellent ROI with quick payback period. Strong financial case for implementation.';
      nextSteps.push('Proceed with detailed implementation planning');
      nextSteps.push('Secure budget approval');
      nextSteps.push('Identify implementation team');
    } else if (roi > 15 && paybackPeriod < 36) {
      priority = 'medium';
      reasoning = 'Good ROI with reasonable payback period. Consider implementation with risk mitigation.';
      nextSteps.push('Conduct detailed risk assessment');
      nextSteps.push('Explore cost reduction opportunities');
      nextSteps.push('Develop phased implementation plan');
    } else {
      priority = 'low';
      reasoning = 'ROI below target or extended payback period. Consider alternative strategies.';
      nextSteps.push('Reassess strategy parameters');
      nextSteps.push('Explore alternative approaches');
      nextSteps.push('Consider smaller pilot implementation');
    }

    const response: ROICalculationResponse = {
      strategy: {
        id: request.strategy.id,
        name: request.strategy.name
      },
      financial: {
        totalInvestment: Math.round(totalInvestment),
        totalBenefits: Math.round(totalBenefits),
        netPresentValue: Math.round(npv),
        roi: Math.round(roi * 100) / 100,
        paybackPeriod: Math.round(paybackPeriod * 100) / 100,
        breakEvenPoint: Math.round(paybackPeriod * 100) / 100
      },
      breakdown: {
        directSavings: Math.round(directSavings),
        avoidedCosts: Math.round(avoidedCosts),
        revenueImpact: Math.round(revenueImpact),
        riskAdjustment: Math.round(riskAdjustment)
      },
      timeline,
      confidence: {
        score: Math.max(0, Math.min(100, confidenceScore)),
        factors: confidenceFactors
      },
      recommendation: {
        priority,
        reasoning,
        nextSteps
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('ROI calculation error:', error);
    res.status(500).json({
      error: 'Internal server error during ROI calculation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Batch ROI calculation for multiple strategies
export const calculateBatchROI = async (req: Request, res: Response): Promise<void> => {
  try {
    const { strategies } = req.body;

    if (!Array.isArray(strategies)) {
      res.status(400).json({
        error: 'Strategies must be an array'
      });
      return;
    }

    const results = [];
    
    for (const strategy of strategies) {
      // Create a mock request object for each strategy
      const mockReq = { body: strategy } as Request;
      const mockRes = {
        status: () => mockRes,
        json: (data: any) => data
      } as any;

      try {
        await calculateROI(mockReq, mockRes);
        results.push(mockRes.json());
      } catch (error) {
        results.push({
          error: `Failed to calculate ROI for strategy ${strategy.strategy?.id}`,
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Sort by ROI descending
    const validResults = results.filter(r => !r.error);
    const sortedResults = validResults.sort((a, b) => b.financial.roi - a.financial.roi);

    res.status(200).json({
      results: sortedResults,
      summary: {
        totalStrategies: strategies.length,
        successfulCalculations: validResults.length,
        highPriorityStrategies: validResults.filter(r => r.recommendation.priority === 'high').length,
        averageROI: validResults.length > 0 
          ? Math.round((validResults.reduce((sum, r) => sum + r.financial.roi, 0) / validResults.length) * 100) / 100
          : 0
      }
    });

  } catch (error) {
    console.error('Batch ROI calculation error:', error);
    res.status(500).json({
      error: 'Internal server error during batch ROI calculation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};