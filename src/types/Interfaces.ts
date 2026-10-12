export interface SneakerCardProps {
    product_image: string
    daysLeft: number
    product_name: string
    price: number
    brand_name: string
    model: string
    size: string
    id:number
    onVoteSuccess?: (productId: number) => void;

  votedProducts?: number[];

    // isVoted?: boolean
  }

  // interface SneakerCardProps {
  //   id: number;
  //   product_image: string;
  //   daysLeft: number;
  //   product_name: string;
  //   price: number;
  //   brand_name: string;
  //   model: string;
  //   size: string;
  // }