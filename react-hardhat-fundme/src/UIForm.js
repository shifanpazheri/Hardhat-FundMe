import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Stack from "react-bootstrap/Stack";
import Form from "react-bootstrap/Form";
import { ethers } from "./ethers-5.6.esm.min.js";
import { abi, contractAddress } from "./constants.js";

function UIForm() {
  const [labelValue, setLabelValue] = useState("");
  const [ethAmountInput, setEthAmountInput] = useState("");

  async function connect() {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (error) {
        console.log(error);
      }
      console.log("Connected!");
      setLabelValue("Connected");
    } else {
      console.log("Please install metamask!");
      setLabelValue("Please install metamask!");
    }
  }

  async function fund() {
    const ethAmount = ethAmountInput != "" ? ethAmountInput : "0.05";
    console.log("ethAmount = " + ethAmount);
    if (typeof window.ethereum !== "undefined") {
      //Provider to connect to blockchain
      //signer/wallet - gas fee
      //Contract
      //ABI,bytecode and address
      const provider = await new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = await new ethers.Contract(contractAddress, abi, signer);
      console.log(contract);
      try {
        const transactionResponse = await contract.fund({
          value: ethers.utils.parseEther(ethAmount),
        });
        console.log(transactionResponse);
        await listenForTransactionMine(transactionResponse, provider);
        console.log("Fund Added ...");
        setLabelValue(ethAmount + "ETH funded!");
      } catch (error) {
        console.log(error);
      }
    }
  }

  function listenForTransactionMine(transactionResponse, provider) {
    console.log("Mining " + transactionResponse.hash + "...");
    return new Promise((resolve, reject) => {
      provider.once(transactionResponse.hash, (transactionReceipt) => {
        console.log(
          "Completed with " +
            transactionReceipt.confirmations +
            " confirmations"
        );
        resolve();
      });
    });
  }

  async function getBalance() {
    if (typeof window.ethereum !== "undefined") {
      const provider = await new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(contractAddress);
      console.log(ethers.utils.formatEther(balance));
      setLabelValue("Contract Balance = " + ethers.utils.formatEther(balance));
    }
  }

  async function withdraw() {
    if (typeof window.ethereum !== "undefined") {
      const provider = await new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = await new ethers.Contract(contractAddress, abi, signer);
      try {
        const transactionResponse = await contract.withdraw();
        console.log(transactionResponse);
        await listenForTransactionMine(transactionResponse, provider);
        console.log("Fund Withdrawn ...");
      } catch (error) {
        console.log(error);
      }
    }
  }

  function handleInputChange(event) {
    setEthAmountInput(event.target.value);
  }

  return (
    <Stack gap={2} className="col-md-5 mx-auto mt-5 mb-5 mr-5 ml-5">
      <Button variant="secondary" onClick={connect}>
        Connect
      </Button>
      <Form.Group>
        <Form.Label>Enter desired amount in ETH</Form.Label>
        <Form.Control
          type="number"
          step="any"
          placeholder="0.05"
          value={ethAmountInput}
          onChange={handleInputChange}
        />
      </Form.Group>
      <Button variant="primary" onClick={fund}>
        Fund
      </Button>
      <Button variant="success" onClick={getBalance}>
        Check Balance
      </Button>
      <Button variant="danger" onClick={withdraw}>
        Withdraw Fund
      </Button>
      <Form.Group>
        <Form.Label>{labelValue}</Form.Label>
      </Form.Group>
    </Stack>
  );
}

export default UIForm;
